export interface AdditionalData { fullname: string; registrationNumber: string }
export async function registerUser(email: string, password: string, additionalData: AdditionalData, recaptchaToken?: string) {
  const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, ...additionalData, recaptchaToken }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Falha ao cadastrar");
  return result;
}
