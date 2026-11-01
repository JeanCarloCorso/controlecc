import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { resetPasswordSchema } from "@/lib/schemas";
import { apiErrorResponse, ApiError, assertTrustedOrigin, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim() || "unknown";
    if (!rateLimit(`reset-submit:${ip}`, 10, 15 * 60_000)) throw new ApiError(429, "Muitas tentativas");
    const body = await readJson(request, resetPasswordSchema);
    const tokenHash = hashToken(body.token);

    const candidate = await query<{ user_id: string }>("SELECT user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='reset_password' AND used_at IS NULL AND expires_at > now()", [tokenHash]);
    if (!candidate.rows[0]) throw new ApiError(400, "Token inválido ou expirado");

    const { default: argon2 } = await import("argon2");
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    const changed = await transaction(async (client) => {
      const found = await client.query<{ id: string; user_id: string }>("SELECT id, user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='reset_password' AND used_at IS NULL AND expires_at > now() FOR UPDATE", [tokenHash]);
      if (!found.rows[0]) return false;
      await client.query("UPDATE users SET password_hash=$1, session_version=session_version+1, updated_at=now() WHERE id=$2", [passwordHash, found.rows[0].user_id]);
      await client.query("UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND purpose='reset_password' AND used_at IS NULL", [found.rows[0].user_id]);
      return true;
    });
    if (!changed) throw new ApiError(400, "Token inválido ou expirado");
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error, "Falha ao redefinir senha"); }
}
