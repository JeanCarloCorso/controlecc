import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";
import { passwordChangeSchema } from "@/lib/schemas";
import { apiErrorResponse, ApiError, assertTrustedOrigin, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser();
    if (!rateLimit(`password-change:${user.id}`, 5, 15 * 60_000)) throw new ApiError(429, "Muitas tentativas");
    const body = await readJson(request, passwordChangeSchema);
    const result = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=$1", [user.id]);
    if (!result.rows[0]) throw new ApiError(404, "Usuário não encontrado");
    const { default: argon2 } = await import("argon2");
    if (!(await argon2.verify(result.rows[0].password_hash, body.currentPassword))) throw new ApiError(400, "A senha atual está incorreta");
    const passwordHash = await argon2.hash(body.newPassword, { type: argon2.argon2id });
    await query("UPDATE users SET password_hash=$1, session_version=session_version+1, updated_at=now() WHERE id=$2", [passwordHash, user.id]);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error, "Falha ao alterar senha"); }
}
