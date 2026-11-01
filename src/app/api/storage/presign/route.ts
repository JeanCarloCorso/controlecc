import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { z } from "zod";
import { apiErrorResponse, assertTrustedOrigin, readJson } from "@/lib/http";
import { createPdfUpload, MAX_PDF_SIZE } from "@/lib/pdf-storage";
import { rateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  contentType: z.literal("application/pdf"),
  size: z.number().int().min(1).max(MAX_PDF_SIZE),
}).strict();

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser();
    if (!rateLimit(`pdf-upload:${user.id}`, 20, 60 * 60_000)) {
      return NextResponse.json({ error: "Limite de uploads excedido" }, { status: 429 });
    }
    await readJson(request, requestSchema);
    return NextResponse.json(await createPdfUpload(user.id));
  } catch (error) {
    return apiErrorResponse(error, "Falha ao preparar upload de PDF");
  }
}
