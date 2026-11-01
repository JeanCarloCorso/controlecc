import { createHash, randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { PDFDocument } from "pdf-lib";
import { getStorageClients } from "@/lib/minio";
import { ApiError } from "@/lib/http";

export const MAX_PDF_SIZE = 5 * 1024 * 1024;
const PDF_CONTENT_TYPE = "application/pdf";
const PDF_KEY_PATTERN = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\.pdf$/i;

export function isOwnedPdfKey(userId: string, key: string) {
  const match = PDF_KEY_PATTERN.exec(key);
  return Boolean(match && match[1].toLowerCase() === userId.toLowerCase());
}

export async function createPdfUpload(userId: string) {
  const { bucket, public: publicS3 } = getStorageClients();
  const key = `${userId}/${randomUUID()}.pdf`;
  const result = await createPresignedPost(publicS3, {
    Bucket: bucket,
    Key: key,
    Expires: 300,
    Fields: { "Content-Type": PDF_CONTENT_TYPE },
    Conditions: [
      ["content-length-range", 1, MAX_PDF_SIZE],
      ["eq", "$Content-Type", PDF_CONTENT_TYPE],
    ],
  });
  return { ...result, key };
}

async function readLimitedBody(body: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const rawChunk of body) {
    const chunk = rawChunk instanceof Uint8Array ? rawChunk : new Uint8Array(rawChunk);
    size += chunk.byteLength;
    if (size > MAX_PDF_SIZE) throw new ApiError(400, "PDF inválido ou muito grande");
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function validateStoredPdf(userId: string, key: string, claimedHash: string) {
  if (!isOwnedPdfKey(userId, key)) throw new ApiError(400, "Chave de arquivo inválida");

  let object;
  try {
    const { bucket, internal } = getStorageClients();
    object = await internal.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    throw new ApiError(400, "O PDF enviado não foi encontrado");
  }

  if (!object.Body || object.ContentType !== PDF_CONTENT_TYPE || !object.ContentLength || object.ContentLength > MAX_PDF_SIZE) {
    throw new ApiError(400, "PDF inválido ou muito grande");
  }

  const bytes = await readLimitedBody(object.Body as AsyncIterable<Uint8Array>);
  const signature = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
  if (signature !== "%PDF-") throw new ApiError(400, "O arquivo enviado não é um PDF válido");

  try {
    await PDFDocument.load(bytes, { updateMetadata: false });
  } catch {
    throw new ApiError(400, "O arquivo PDF está corrompido ou não é suportado");
  }

  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== claimedHash) throw new ApiError(400, "A integridade do PDF não pôde ser confirmada");
  return actualHash;
}

export async function deleteStoredPdf(userId: string, key: string) {
  if (!isOwnedPdfKey(userId, key)) return;
  const { bucket, internal } = getStorageClients();
  await internal.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
