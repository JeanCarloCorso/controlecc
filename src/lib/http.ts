import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DEFAULT_MAX_BODY_BYTES = 16 * 1024;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string,
    message = publicMessage,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<z.infer<T>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ApiError(415, "O corpo da requisição deve ser JSON");
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiError(413, "Corpo da requisição muito grande");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Corpo da requisição ausente");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new ApiError(413, "Corpo da requisição muito grande");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new ApiError(400, "JSON inválido");
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos");
  return parsed.data;
}

function configuredOrigins(request: NextRequest) {
  const origins = new Set<string>();
  for (const candidate of [process.env.APP_URL, process.env.NEXTAUTH_URL, request.nextUrl.origin]) {
    if (!candidate) continue;
    try {
      origins.add(new URL(candidate).origin);
    } catch {
      // Invalid deployment configuration is handled by rejecting unmatched origins.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0].trim();
  const host = forwardedHost || request.headers.get("host");
  if (host) {
    const protocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0].trim()
      || request.nextUrl.protocol.replace(":", "")
      || "https";
    try {
      origins.add(new URL(`${protocol}://${host}`).origin);
    } catch {
      // Ignore malformed proxy headers; they must never expand the allow-list.
    }
  }
  return origins;
}

export function assertTrustedOrigin(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "Origem da requisição não permitida");
  }

  const origin = request.headers.get("origin");
  if (!origin) return;
  if (origin === "null" || !configuredOrigins(request).has(origin)) {
    throw new ApiError(403, "Origem da requisição não permitida");
  }
}

export function apiErrorResponse(error: unknown, context: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.publicMessage }, { status: error.status });
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  console.error(context, error);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
