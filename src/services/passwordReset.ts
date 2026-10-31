export async function sendPasswordReset(email: string) {
  const response = await fetch("/api/auth-tokens/reset-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
  if (!response.ok) throw new Error("Falha ao solicitar redefinição");
}
