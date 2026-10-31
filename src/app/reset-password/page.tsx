"use client";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/auth-tokens/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }); const body = await response.json(); setMessage(response.ok ? "Senha alterada com sucesso." : body.error); }
  return <div className="gov-auth-page"><GovPublicHeader /><main className="gov-auth-main"><Card className="gov-auth-card"><CardHeader><p className="gov-eyebrow">Segurança da conta</p><CardTitle>Redefinir senha</CardTitle><CardDescription>Crie uma nova senha com no mínimo oito caracteres.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><label className="block font-semibold" htmlFor="new-password">Nova senha</label><Input id="new-password" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua nova senha"/><Button className="w-full" type="submit">Salvar nova senha</Button></form>{message && <p className="gov-status-info mt-5" role="status">{message}</p>}<Link className="mt-6 inline-block font-semibold underline" href="/login">Voltar para o login</Link></CardContent></Card></main><GovFooter /></div>;
}
export default function ResetPasswordPage() { return <Suspense fallback={<main className="p-8 text-center">Carregando...</main>}><ResetPasswordContent /></Suspense>; }
