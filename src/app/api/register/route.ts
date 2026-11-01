import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuthToken } from "@/lib/tokens";
import { sendAccountEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { registrationSchema } from "@/lib/schemas";
import { apiErrorResponse, ApiError, assertTrustedOrigin, readJson } from "@/lib/http";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim() || "unknown";
    if (!rateLimit(`register:${ip}`, 5, 15 * 60_000)) throw new ApiError(429, "Muitas tentativas");
    const body = await readJson(request, registrationSchema);
    await verifyRecaptcha(body.recaptchaToken, ip);

    const { default: argon2 } = await import("argon2");
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    const result = await query<{ id: string }>("INSERT INTO users(email, password_hash, full_name, registration_number) VALUES($1, $2, $3, $4) RETURNING id", [body.email, passwordHash, body.fullname, body.registrationNumber]);
    try {
      const token = await createAuthToken(result.rows[0].id, "verify_email", 24);
      await sendAccountEmail(body.email, "verify_email", `/verify-email?token=${encodeURIComponent(token)}`, body.fullname);
    } catch (error) {
      await query("DELETE FROM users WHERE id=$1 AND email_verified_at IS NULL", [result.rows[0].id]).catch((cleanupError) => console.error("Falha ao reverter cadastro sem e-mail", cleanupError));
      throw error;
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    return apiErrorResponse(error, "Falha ao cadastrar usuário");
  }
}
