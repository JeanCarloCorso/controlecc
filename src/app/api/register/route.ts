import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { createAuthToken } from "@/lib/tokens";
import { sendAccountEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
const schema = z.object({ email: z.string().email(), password: z.string().min(8).max(128), fullname: z.string().min(2).max(255), registrationNumber: z.string().min(2).max(100), recaptchaToken: z.string().optional() });
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!rateLimit(`register:${ip}`, 5, 15 * 60_000)) return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados de cadastro inválidos" }, { status: 400 });
  if (process.env.RECAPTCHA_SECRET) {
    const verify = await fetch("https://www.google.com/recaptcha/api/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: parsed.data.recaptchaToken || "" }) });
    if (!(await verify.json()).success) return NextResponse.json({ error: "reCAPTCHA inválido" }, { status: 400 });
  }
  try {
    const { default: argon2 } = await import("argon2");
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    const result = await query<{ id: string }>("INSERT INTO users(email, password_hash, full_name, registration_number) VALUES(lower($1), $2, $3, $4) RETURNING id", [parsed.data.email, passwordHash, parsed.data.fullname, parsed.data.registrationNumber]);
    const token = await createAuthToken(result.rows[0].id, "verify_email", 24);
    await sendAccountEmail(parsed.data.email, "Confirme seu e-mail", `/verify-email?token=${encodeURIComponent(token)}`);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    throw error;
  }
}
