import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";
import { activityCreateSchema, courseCreateSchema, eventTypeCreateSchema, uuidSchema } from "@/lib/schemas";
import { apiErrorResponse, ApiError, assertTrustedOrigin, readJson } from "@/lib/http";
import { deleteStoredPdf, validateStoredPdf } from "@/lib/pdf-storage";
import { normalizeDateOnly } from "@/lib/date";

type ActivityRow = { id: string; user_id: string; project_id: string | null; event_type_id: string | null; name: string; description: string; workload: number; completion_date: Date | string; status: string; observation: string | null; file_key: string; file_hash: string; archived: boolean; created_at: Date | string };
const dateValue = (value: Date | string) => ({ seconds: Math.floor(new Date(value).getTime() / 1000) });
const mapActivity = (row: ActivityRow) => ({ id: row.id, uid: row.id, userId: row.user_id, projectId: row.project_id, eventTypeId: row.event_type_id, name: row.name, description: row.description, workload: String(row.workload), completionDate: normalizeDateOnly(row.completion_date), status: row.status, observation: row.observation, pathFile: row.file_key, hashFile: row.file_hash, archived: row.archived, createdAt: dateValue(row.created_at) });

export async function GET(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const user = await requireUser();
    const { collection: kind } = await params;
    if (kind === "courses") {
      const result = await query("SELECT c.id, c.name, c.created_at, coalesce(json_agg(json_build_object('uid', p.id, 'id', p.id, 'name', p.name, 'year', p.year, 'course', c.name) ORDER BY p.year DESC) FILTER (WHERE p.id IS NOT NULL), '[]') projects FROM courses c LEFT JOIN projects p ON p.course_id=c.id GROUP BY c.id ORDER BY c.name");
      return NextResponse.json(result.rows.map((row) => ({ ...row, createdAt: dateValue(row.created_at) })));
    }
    if (kind === "eventTypes") {
      const result = await query("SELECT id, name, created_at FROM event_types ORDER BY name");
      return NextResponse.json(result.rows.map((row) => ({ ...row, createdAt: dateValue(row.created_at) })));
    }
    if (kind === "users") {
      if (user.role !== "admin") throw new ApiError(403, "Acesso negado");
      const result = await query("SELECT id, email, full_name, registration_number, role, email_verified_at, created_at FROM users ORDER BY full_name");
      return NextResponse.json(result.rows.map((row) => ({ id: row.id, email: row.email, fullname: row.full_name, registrationNumber: row.registration_number, role: row.role === "student" ? "common" : row.role, emailVerified: Boolean(row.email_verified_at), createdAt: dateValue(row.created_at) })));
    }
    if (kind === "files") {
      const values: unknown[] = [];
      const clauses: string[] = [];
      if (user.role !== "admin") { values.push(user.id); clauses.push(`user_id=$${values.length}`); }
      const requestedUser = request.nextUrl.searchParams.get("userId");
      const requestedHash = request.nextUrl.searchParams.get("hashFile");
      if (requestedUser) {
        const parsedUser = uuidSchema.safeParse(requestedUser);
        if (!parsedUser.success) throw new ApiError(400, "Filtro de usuário inválido");
        values.push(parsedUser.data);
        clauses.push(`user_id=$${values.length}`);
      }
      if (requestedHash) {
        if (!/^[a-f0-9]{64}$/.test(requestedHash)) throw new ApiError(400, "Filtro de hash inválido");
        values.push(requestedHash);
        clauses.push(`file_hash=$${values.length}`);
      }
      const result = await query<ActivityRow>(`SELECT id, user_id, project_id, event_type_id, name, description, workload, completion_date, status, observation, file_key, file_hash, archived, created_at FROM activities ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY created_at DESC`, values);
      return NextResponse.json(result.rows.map(mapActivity));
    }
    throw new ApiError(404, "Coleção desconhecida");
  } catch (error) { return apiErrorResponse(error, "Falha ao consultar coleção"); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser();
    const { collection: kind } = await params;
    if (kind === "files") {
      const body = await readJson(request, activityCreateSchema);
      if (body.userId && body.userId !== user.id) throw new ApiError(403, "Usuário inválido para esta atividade");
      await validateStoredPdf(user.id, body.pathFile, body.hashFile);
      try {
        const result = await query<{ id: string }>("INSERT INTO activities(user_id, project_id, event_type_id, name, description, workload, completion_date, file_key, file_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id", [user.id, body.projectId || null, body.eventTypeId || null, body.name, body.description, body.workload, body.completionDate, body.pathFile, body.hashFile]);
        return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
      } catch (error) {
        const existing = await query("SELECT 1 FROM activities WHERE file_key=$1", [body.pathFile]);
        if (!existing.rowCount) await deleteStoredPdf(user.id, body.pathFile).catch((cleanupError) => console.error("Falha ao remover upload órfão", cleanupError));
        if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Este PDF já foi cadastrado");
        throw error;
      }
    }
    if (user.role !== "admin") throw new ApiError(403, "Acesso negado");
    if (kind === "courses") {
      const body = await readJson(request, courseCreateSchema);
      const result = await query<{ id: string }>("INSERT INTO courses(name) VALUES($1) RETURNING id", [body.name]);
      return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
    }
    if (kind === "eventTypes") {
      const body = await readJson(request, eventTypeCreateSchema);
      const result = await query<{ id: string }>("INSERT INTO event_types(name) VALUES($1) RETURNING id", [body.name]);
      return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
    }
    throw new ApiError(400, "Operação inválida");
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "Registro duplicado" }, { status: 409 });
    if ((error as { code?: string }).code === "23503") return NextResponse.json({ error: "Referência inválida" }, { status: 400 });
    return apiErrorResponse(error, "Falha ao criar registro");
  }
}
