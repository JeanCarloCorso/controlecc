import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CERTIFICATES_BUCKET, publicS3 } from "@/lib/minio";
import { requireUser } from "@/lib/server-auth";
import { query } from "@/lib/db";
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const key = request.nextUrl.searchParams.get("key") || "";
    const allowed = user.role === "admin" || key.startsWith(`${user.id}/`) || (await query("SELECT 1 FROM activities WHERE file_key=$1 AND user_id=$2", [key, user.id])).rowCount;
    if (!allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const url = await getSignedUrl(publicS3, new GetObjectCommand({ Bucket: CERTIFICATES_BUCKET, Key: key, ResponseContentType: "application/pdf" }), { expiresIn: 300 });
    return NextResponse.json({ url });
  } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
}
