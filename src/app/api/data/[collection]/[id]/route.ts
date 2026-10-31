import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, { params }: { params: { collection: string; id: string } }) {
  try {
    const user = await requireUser("admin");
    const body = await request.json();
    if (params.collection === "files") {
      const status = ["pending", "approved", "rejected"].includes(body.status) ? body.status : undefined;
      await query("UPDATE activities SET status=coalesce($1,status), observation=coalesce($2,observation), workload=coalesce($3,workload), archived=coalesce($4,archived), reviewed_at=CASE WHEN $1 IS NOT NULL THEN now() ELSE reviewed_at END, reviewed_by=CASE WHEN $1 IS NOT NULL THEN $5 ELSE reviewed_by END WHERE id=$6", [status || null, body.observation ?? null, body.workload ? Number(body.workload) : null, body.archived ?? null, user.id, params.id]);
      return NextResponse.json({ ok: true });
    }
    if (params.collection === "courses") {
      await transaction(async client => {
        if (body.name) await client.query("UPDATE courses SET name=$1 WHERE id=$2", [body.name, params.id]);
        if (Array.isArray(body.projects)) {
          const ids = body.projects.map((p: any) => p.uid || p.id).filter((id: unknown): id is string => typeof id === "string" && UUID_PATTERN.test(id));
          if (ids.length) await client.query("DELETE FROM projects WHERE course_id=$1 AND NOT(id = ANY($2::uuid[]))", [params.id, ids]); else await client.query("DELETE FROM projects WHERE course_id=$1", [params.id]);
          for (const project of body.projects) {
            const id = project.uid || project.id;
            if (typeof id === "string" && UUID_PATTERN.test(id)) await client.query("INSERT INTO projects(id,course_id,name,year) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET name=excluded.name, year=excluded.year", [id, params.id, project.name, Number(project.year)]);
            else await client.query("INSERT INTO projects(course_id,name,year) VALUES($1,$2,$3)", [params.id, project.name, Number(project.year)]);
          }
        }
      });
      return NextResponse.json({ ok: true });
    }
    if (params.collection === "eventTypes") { await query("UPDATE event_types SET name=$1 WHERE id=$2", [body.name, params.id]); return NextResponse.json({ ok: true }); }
    if (params.collection === "users") { await query("UPDATE users SET full_name=coalesce($1,full_name), email=coalesce(lower($2),email), role=coalesce($3,role), updated_at=now() WHERE id=$4", [body.name || body.fullname || null, body.email || null, body.role === "common" ? "student" : body.role || null, params.id]); return NextResponse.json({ ok: true }); }
    return NextResponse.json({ error: "Operação inválida" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    console.error("Falha ao atualizar registro", error);
    return NextResponse.json({ error: "Erro interno ao atualizar registro" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { collection: string; id: string } }) {
  try {
    await requireUser("admin");
    const tables: Record<string, string> = { courses: "courses", eventTypes: "event_types", users: "users", files: "activities" };
    const table = tables[params.collection];
    if (!table) return NextResponse.json({ error: "Operação inválida" }, { status: 400 });
    await query(`DELETE FROM ${table} WHERE id=$1`, [params.id]);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) { return NextResponse.json({ error: "Acesso negado" }, { status: error.message === "FORBIDDEN" ? 403 : 401 }); }
}
