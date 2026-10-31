import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CERTIFICATES_BUCKET, publicS3 } from "@/lib/minio";
import { requireUser } from "@/lib/server-auth";
const MAX_PDF_SIZE = 5 * 1024 * 1024;
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { key, contentType, size } = await request.json();
    if (contentType !== "application/pdf" || Number(size) <= 0 || Number(size) > MAX_PDF_SIZE || !String(key).startsWith(`${user.id}/`) || !String(key).endsWith(".pdf")) return NextResponse.json({ error: "PDF inválido (limite de 5 MB)" }, { status: 400 });
    const url = await getSignedUrl(publicS3, new PutObjectCommand({ Bucket: CERTIFICATES_BUCKET, Key: key, ContentType: "application/pdf" }), { expiresIn: 300 });
    return NextResponse.json({ url });
  } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
}
