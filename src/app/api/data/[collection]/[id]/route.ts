import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";
import { activityPatchSchema, coursePatchSchema, eventTypePatchSchema, userPatchSchema, uuidSchema } from "@/lib/schemas";
import { apiErrorResponse, ApiError, assertTrustedOrigin, readJson } from "@/lib/http";

type RouteParams = { collection: string; id: string };

export async function PATCH(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser("admin");
    const { collection, id: rawId } = await params;
    const parsedId = uuidSchema.safeParse(rawId);
    if (!parsedId.success) throw new ApiError(400, "Identificador inválido");
    const id = parsedId.data;

    if (collection === "files") {
      const body = await readJson(request, activityPatchSchema);
      await transaction(async (client) => {
        const result = await client.query<{ user_id: string; name: string; status: "pending" | "approved" | "rejected" }>("UPDATE activities SET status=coalesce($1,status), observation=CASE WHEN $2::boolean THEN $3 ELSE observation END, workload=coalesce($4,workload), archived=coalesce($5,archived), reviewed_at=CASE WHEN $1 IS NOT NULL THEN now() ELSE reviewed_at END, reviewed_by=CASE WHEN $1 IS NOT NULL THEN $6 ELSE reviewed_by END WHERE id=$7 RETURNING user_id, name, status", [body.status ?? null, "observation" in body, body.observation ?? null, body.workload ?? null, body.archived ?? null, user.id, id]);
        if (!result.rows[0]) throw new ApiError(404, "Atividade não encontrada");
        if (body.status) {
          const activity = result.rows[0];
          const statusLabel = { approved: "aprovada", rejected: "rejeitada", pending: "marcada como pendente" }[activity.status];
          const observation = body.observation?.trim();
          const message = `Sua atividade "${activity.name}" foi ${statusLabel}.${observation ? ` Observação: ${observation}` : ""}`;
          await client.query("INSERT INTO notifications(user_id, activity_id, title, message) VALUES($1,$2,$3,$4)", [activity.user_id, id, "Atividade avaliada", message]);
        }
      });
      return NextResponse.json({ ok: true });
    }

    if (collection === "courses") {
      const body = await readJson(request, coursePatchSchema, 64 * 1024);
      await transaction(async (client) => {
        const locked = await client.query("SELECT 1 FROM courses WHERE id=$1 FOR UPDATE", [id]);
        if (!locked.rowCount) throw new ApiError(404, "Curso não encontrado");
        if (body.name) await client.query("UPDATE courses SET name=$1 WHERE id=$2", [body.name, id]);
        if (body.projects) {
          const projectIds = body.projects.map((project) => project.id || project.uid).filter((projectId): projectId is string => Boolean(projectId));
          if (projectIds.length) await client.query("DELETE FROM projects WHERE course_id=$1 AND NOT(id = ANY($2::uuid[]))", [id, projectIds]);
          else await client.query("DELETE FROM projects WHERE course_id=$1", [id]);
          for (const project of body.projects) {
            const projectId = project.id || project.uid;
            if (projectId) {
              const existing = await client.query<{ course_id: string }>("SELECT course_id FROM projects WHERE id=$1", [projectId]);
              if (existing.rows[0] && existing.rows[0].course_id !== id) throw new ApiError(400, "Projeto inválido para este curso");
              if (existing.rows[0]) await client.query("UPDATE projects SET name=$1, year=$2 WHERE id=$3 AND course_id=$4", [project.name, project.year, projectId, id]);
              else await client.query("INSERT INTO projects(id,course_id,name,year) VALUES($1,$2,$3,$4)", [projectId, id, project.name, project.year]);
            } else await client.query("INSERT INTO projects(course_id,name,year) VALUES($1,$2,$3)", [id, project.name, project.year]);
          }
        }
      });
      return NextResponse.json({ ok: true });
    }

    if (collection === "eventTypes") {
      const body = await readJson(request, eventTypePatchSchema);
      const result = await query("UPDATE event_types SET name=$1 WHERE id=$2", [body.name, id]);
      if (!result.rowCount) throw new ApiError(404, "Tipo de evento não encontrado");
      return NextResponse.json({ ok: true });
    }

    if (collection === "users") {
      const body = await readJson(request, userPatchSchema);
      await transaction(async (client) => {
        const target = await client.query<{ role: "student" | "admin" }>("SELECT role FROM users WHERE id=$1 FOR UPDATE", [id]);
        if (!target.rows[0]) throw new ApiError(404, "Usuário não encontrado");
        const nextRole = body.role === "common" ? "student" : body.role;
        if (target.rows[0].role === "admin" && nextRole === "student") {
          const admins = await client.query<{ id: string }>("SELECT id FROM users WHERE role='admin' ORDER BY id FOR UPDATE");
          if (admins.rows.length <= 1) throw new ApiError(409, "O último administrador não pode ser rebaixado");
        }
        await client.query("UPDATE users SET full_name=coalesce($1,full_name), email=coalesce($2,email), role=coalesce($3,role), session_version=session_version + CASE WHEN $3 IS NOT NULL THEN 1 ELSE 0 END, updated_at=now() WHERE id=$4", [body.name || body.fullname || null, body.email || null, nextRole || null, id]);
      });
      return NextResponse.json({ ok: true });
    }
    throw new ApiError(400, "Operação inválida");
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "Registro duplicado" }, { status: 409 });
    return apiErrorResponse(error, "Falha ao atualizar registro");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    assertTrustedOrigin(request);
    await requireUser("admin");
    const { collection, id: rawId } = await params;
    const parsedId = uuidSchema.safeParse(rawId);
    if (!parsedId.success) throw new ApiError(400, "Identificador inválido");
    const id = parsedId.data;
    const tables: Record<string, string> = { courses: "courses", eventTypes: "event_types", files: "activities" };
    if (collection === "users") {
      await transaction(async (client) => {
        const target = await client.query<{ role: "student" | "admin" }>("SELECT role FROM users WHERE id=$1 FOR UPDATE", [id]);
        if (!target.rows[0]) throw new ApiError(404, "Usuário não encontrado");
        if (target.rows[0].role === "admin") {
          const admins = await client.query<{ id: string }>("SELECT id FROM users WHERE role='admin' ORDER BY id FOR UPDATE");
          if (admins.rows.length <= 1) throw new ApiError(409, "O último administrador não pode ser removido");
        }
        await client.query("DELETE FROM users WHERE id=$1", [id]);
      });
      return new NextResponse(null, { status: 204 });
    }
    const table = tables[collection];
    if (!table) throw new ApiError(400, "Operação inválida");
    const result = await query(`DELETE FROM ${table} WHERE id=$1`, [id]);
    if (!result.rowCount) throw new ApiError(404, "Registro não encontrado");
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiErrorResponse(error, "Falha ao excluir registro"); }
}
