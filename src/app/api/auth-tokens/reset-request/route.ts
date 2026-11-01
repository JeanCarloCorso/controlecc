import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuthToken } from "@/lib/tokens";
import { sendAccountEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { resetRequestSchema } from "@/lib/schemas";
import { apiErrorResponse, assertTrustedOrigin, readJson } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim() || "unknown";
    if (!rateLimit(`reset-request:${ip}`, 5, 15 * 60_000)) return NextResponse.json({ ok: true });
    const body = await readJson(request, resetRequestSchema);
    const found = await query<{ id: string; email: string; full_name: string }>("SELECT id, email, full_name FROM users WHERE email=$1", [body.email]);
    if (found.rows[0]) {
      const token = await createAuthToken(found.rows[0].id, "reset_password", 1);
      await sendAccountEmail(found.rows[0].email, "reset_password", `/reset-password?token=${encodeURIComponent(token)}`, found.rows[0].full_name);
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error, "Falha ao solicitar redefinição de senha"); }
}
