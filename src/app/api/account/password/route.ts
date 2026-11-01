import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
}).refine((data) => data.currentPassword !== data.newPassword, {
  path: ["newPassword"], message: "A nova senha deve ser diferente da senha atual",
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });

    const result = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=$1", [user.id]);
    if (!result.rows[0]) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const { default: argon2 } = await import("argon2");
    if (!(await argon2.verify(result.rows[0].password_hash, parsed.data.currentPassword))) {
      return NextResponse.json({ error: "A senha atual está incorreta" }, { status: 400 });
    }

    const passwordHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id });
    await query("UPDATE users SET password_hash=$1, session_version=session_version+1, updated_at=now() WHERE id=$2", [passwordHash, user.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Sessão inválida" : "Não foi possível alterar a senha" }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
