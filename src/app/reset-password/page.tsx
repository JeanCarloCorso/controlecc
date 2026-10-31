"use client";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/auth-tokens/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }); const body = await response.json(); setMessage(response.ok ? "Senha alterada com sucesso." : body.error); }
  return <main className="mx-auto mt-20 max-w-md rounded border p-8"><h1 className="mb-4 text-2xl font-semibold">Redefinir senha</h1><form onSubmit={submit} className="space-y-4"><input className="w-full rounded border p-2" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova senha (mínimo 8 caracteres)"/><button className="w-full rounded bg-primary p-2 text-primary-foreground">Salvar nova senha</button></form>{message && <p className="mt-4">{message}</p>}<Link className="mt-6 inline-block underline" href="/login">Ir para o login</Link></main>;
}
export default function ResetPasswordPage() { return <Suspense fallback={<main className="p-8 text-center">Carregando...</main>}><ResetPasswordContent /></Suspense>; }
