"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const [message, setMessage] = useState("Confirmando seu e-mail...");
  useEffect(() => { if (!token) { setMessage("Token ausente."); return; } fetch("/api/auth-tokens/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async response => { const body = await response.json(); setMessage(response.ok ? "E-mail confirmado. Você já pode entrar." : body.error); }).catch(() => setMessage("Não foi possível confirmar o e-mail.")); }, [token]);
  return <main className="mx-auto mt-20 max-w-md rounded border p-8 text-center"><h1 className="mb-4 text-2xl font-semibold">Confirmação de e-mail</h1><p>{message}</p><Link className="mt-6 inline-block underline" href="/login">Ir para o login</Link></main>;
}
export default function VerifyEmailPage() { return <Suspense fallback={<main className="p-8 text-center">Carregando...</main>}><VerifyEmailContent /></Suspense>; }
