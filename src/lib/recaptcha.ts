import { ApiError } from "@/lib/http";

type RecaptchaResponse = { success?: boolean };

export async function verifyRecaptcha(token: string | undefined, remoteIp?: string) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new ApiError(503, "Cadastro temporariamente indisponível");
    return;
  }
  if (!token) throw new ApiError(400, "reCAPTCHA inválido");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok || !(await response.json() as RecaptchaResponse).success) throw new ApiError(400, "reCAPTCHA inválido");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "Não foi possível validar o reCAPTCHA");
  } finally {
    clearTimeout(timeout);
  }
}
