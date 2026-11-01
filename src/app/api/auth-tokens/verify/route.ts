import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { tokenSchema } from "@/lib/schemas";
import { apiErrorResponse, ApiError, assertTrustedOrigin, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim() || "unknown";
    if (!rateLimit(`verify-email:${ip}`, 20, 15 * 60_000)) throw new ApiError(429, "Muitas tentativas");
    const body = await readJson(request, tokenSchema);
    const ok = await transaction(async (client) => {
      const found = await client.query<{ id: string; user_id: string }>("SELECT id, user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='verify_email' AND used_at IS NULL AND expires_at > now() FOR UPDATE", [hashToken(body.token)]);
      if (!found.rows[0]) return false;
      await client.query("UPDATE users SET email_verified_at=coalesce(email_verified_at, now()), updated_at=now() WHERE id=$1", [found.rows[0].user_id]);
      await client.query("UPDATE auth_tokens SET used_at=now() WHERE id=$1", [found.rows[0].id]);
      return true;
    });
    if (!ok) throw new ApiError(400, "Token inválido ou expirado");
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error, "Falha ao verificar e-mail"); }
}
