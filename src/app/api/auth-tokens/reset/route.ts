import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
export async function POST(request: NextRequest) {
  const { token, password } = await request.json();
  if (!token || typeof password !== "string" || password.length < 8) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { default: argon2 } = await import("argon2");
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const ok = await transaction(async client => {
    const found = await client.query<{ id: string; user_id: string }>("SELECT id, user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='reset_password' AND used_at IS NULL AND expires_at > now() FOR UPDATE", [hashToken(token)]);
    if (!found.rows[0]) return false;
    await client.query("UPDATE users SET password_hash=$1, session_version=session_version+1, updated_at=now() WHERE id=$2", [passwordHash, found.rows[0].user_id]);
    await client.query("UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND purpose='reset_password' AND used_at IS NULL", [found.rows[0].user_id]);
    return true;
  });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
}
