import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageClients } from "@/lib/minio";
import { requireUser } from "@/lib/server-auth";
import { query } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!rateLimit(`pdf-url:${user.id}`, 120, 60_000)) throw new ApiError(429, "Muitas solicitações de arquivo");
    const key = request.nextUrl.searchParams.get("key") || "";
    if (!key || key.length > 1024) throw new ApiError(400, "Chave de arquivo inválida");
    const allowed = user.role === "admin"
      ? (await query("SELECT 1 FROM activities WHERE file_key=$1", [key])).rowCount
      : (await query("SELECT 1 FROM activities WHERE file_key=$1 AND user_id=$2", [key, user.id])).rowCount;
    if (!allowed) throw new ApiError(403, "Acesso negado");
    const { bucket, public: publicS3 } = getStorageClients();
    const url = await getSignedUrl(publicS3, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentType: "application/pdf" }), { expiresIn: 300 });
    return NextResponse.json({ url });
  } catch (error) { return apiErrorResponse(error, "Falha ao gerar URL do PDF"); }
}
