import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";
import { apiErrorResponse, ApiError, assertTrustedOrigin, readJson } from "@/lib/http";
import { notificationReadSchema, uuidSchema } from "@/lib/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser();
    const parsedId = uuidSchema.safeParse((await params).id);
    if (!parsedId.success) throw new ApiError(400, "Notificação inválida");
    await readJson(request, notificationReadSchema);
    const result = await query("UPDATE notifications SET read_at=coalesce(read_at,now()) WHERE id=$1 AND user_id=$2", [parsedId.data, user.id]);
    if (!result.rowCount) throw new ApiError(404, "Notificação não encontrada");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Falha ao atualizar notificação");
  }
}
