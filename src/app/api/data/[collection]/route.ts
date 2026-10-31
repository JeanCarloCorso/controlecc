import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";

const dateValue = (value: Date | string) => ({ seconds: Math.floor(new Date(value).getTime() / 1000) });
const mapActivity = (row: any) => ({ id: row.id, uid: row.id, userId: row.user_id, projectId: row.project_id, eventTypeId: row.event_type_id, name: row.name, description: row.description, workload: String(row.workload), completionDate: row.completion_date, status: row.status, observation: row.observation, pathFile: row.file_key, hashFile: row.file_hash, archived: row.archived, createdAt: dateValue(row.created_at) });

export async function GET(request: NextRequest, { params }: { params: { collection: string } }) {
  try {
    const user = await requireUser();
    const kind = params.collection;
    if (kind === "courses") {
      const result = await query("SELECT c.id, c.name, c.created_at, coalesce(json_agg(json_build_object('uid', p.id, 'id', p.id, 'name', p.name, 'year', p.year, 'course', c.name) ORDER BY p.year DESC) FILTER (WHERE p.id IS NOT NULL), '[]') projects FROM courses c LEFT JOIN projects p ON p.course_id=c.id GROUP BY c.id ORDER BY c.name");
      return NextResponse.json(result.rows.map((r: any) => ({ ...r, createdAt: dateValue(r.created_at) })));
    }
    if (kind === "eventTypes") {
      const result = await query("SELECT id, name, created_at FROM event_types ORDER BY name");
      return NextResponse.json(result.rows.map((r: any) => ({ ...r, createdAt: dateValue(r.created_at) })));
    }
    if (kind === "users") {
      if (user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      const result = await query("SELECT id, email, full_name, registration_number, role, email_verified_at, created_at FROM users ORDER BY full_name");
      return NextResponse.json(result.rows.map((r: any) => ({ id: r.id, email: r.email, fullname: r.full_name, registrationNumber: r.registration_number, role: r.role === "student" ? "common" : r.role, emailVerified: !!r.email_verified_at, createdAt: dateValue(r.created_at) })));
    }
    if (kind === "files") {
      const values: unknown[] = [];
      const clauses: string[] = [];
      if (user.role !== "admin") { values.push(user.id); clauses.push(`user_id=$${values.length}`); }
      const requestedUser = request.nextUrl.searchParams.get("userId");
      const requestedHash = request.nextUrl.searchParams.get("hashFile");
      if (requestedUser) { values.push(requestedUser); clauses.push(`user_id=$${values.length}`); }
      if (requestedHash) { values.push(requestedHash); clauses.push(`file_hash=$${values.length}`); }
      const result = await query(`SELECT * FROM activities ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY created_at DESC`, values);
      return NextResponse.json(result.rows.map(mapActivity));
    }
    return NextResponse.json({ error: "Coleção desconhecida" }, { status: 404 });
  } catch (error: any) { return NextResponse.json({ error: "Não autorizado" }, { status: error.message === "FORBIDDEN" ? 403 : 401 }); }
}

export async function POST(request: NextRequest, { params }: { params: { collection: string } }) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (params.collection === "files") {
      if (!body.name || !body.description || !body.hashFile || !body.pathFile || !body.completionDate || Number(body.workload) <= 0) return NextResponse.json({ error: "Atividade inválida" }, { status: 400 });
      if (!String(body.pathFile).startsWith(`${user.id}/`) || !String(body.pathFile).endsWith(".pdf")) return NextResponse.json({ error: "Chave de arquivo inválida" }, { status: 400 });
      try {
        const result = await query<{ id: string }>("INSERT INTO activities(user_id, project_id, event_type_id, name, description, workload, completion_date, file_key, file_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id", [user.id, body.projectId || null, body.eventTypeId || null, body.name, body.description, Number(body.workload), body.completionDate, body.pathFile, body.hashFile]);
        return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
      } catch (error: any) { if (error.code === "23505") return NextResponse.json({ error: "Este PDF já foi cadastrado" }, { status: 409 }); throw error; }
    }
    if (user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    if (params.collection === "courses") { const result = await query<{ id: string }>("INSERT INTO courses(name) VALUES($1) RETURNING id", [body.name]); return NextResponse.json({ id: result.rows[0].id }, { status: 201 }); }
    if (params.collection === "eventTypes") { const result = await query<{ id: string }>("INSERT INTO event_types(name) VALUES($1) RETURNING id", [body.name]); return NextResponse.json({ id: result.rows[0].id }, { status: 201 }); }
    return NextResponse.json({ error: "Operação inválida" }, { status: 400 });
  } catch (error: any) { return NextResponse.json({ error: error.message === "FORBIDDEN" ? "Acesso negado" : "Não autorizado" }, { status: error.message === "FORBIDDEN" ? 403 : 401 }); }
}
