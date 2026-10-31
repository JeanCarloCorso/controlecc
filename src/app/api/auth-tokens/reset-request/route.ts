import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuthToken } from "@/lib/tokens";
import { sendAccountEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!rateLimit(`reset:${ip}`, 5, 15 * 60_000)) return NextResponse.json({ ok: true });
  const { email } = await request.json();
  const found = await query<{ id: string; email: string; full_name: string }>("SELECT id, email, full_name FROM users WHERE lower(email)=lower($1)", [String(email || "")]);
  if (found.rows[0]) { const token = await createAuthToken(found.rows[0].id, "reset_password", 1); await sendAccountEmail(found.rows[0].email, "reset_password", `/reset-password?token=${encodeURIComponent(token)}`, found.rows[0].full_name); }
  return NextResponse.json({ ok: true });
}
