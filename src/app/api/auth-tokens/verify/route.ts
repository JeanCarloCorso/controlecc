import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Token ausente" }, { status: 400 });
  const ok = await transaction(async client => {
    const found = await client.query<{ id: string; user_id: string }>("SELECT id, user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='verify_email' AND used_at IS NULL AND expires_at > now() FOR UPDATE", [hashToken(token)]);
    if (!found.rows[0]) return false;
    await client.query("UPDATE users SET email_verified_at=coalesce(email_verified_at, now()), updated_at=now() WHERE id=$1", [found.rows[0].user_id]);
    await client.query("UPDATE auth_tokens SET used_at=now() WHERE id=$1", [found.rows[0].id]);
    return true;
  });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
}
