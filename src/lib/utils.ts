import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Função para calcular o hash do conteúdo de um arquivo PDF.
 * @param file - O arquivo PDF do qual o hash será calculado.
 * @returns Uma Promise que resolve para o hash do arquivo PDF.
 */
export async function calculatePdfHash(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
