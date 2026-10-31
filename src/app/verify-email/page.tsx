"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const [message, setMessage] = useState("Confirmando seu e-mail...");
  useEffect(() => { if (!token) { setMessage("Token ausente."); return; } fetch("/api/auth-tokens/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async response => { const body = await response.json(); setMessage(response.ok ? "E-mail confirmado. Você já pode entrar." : body.error); }).catch(() => setMessage("Não foi possível confirmar o e-mail.")); }, [token]);
  return <div className="gov-auth-page"><GovPublicHeader /><main className="gov-auth-main"><Card className="gov-auth-card"><CardHeader><p className="gov-eyebrow">Validação de cadastro</p><CardTitle>Confirmação de e-mail</CardTitle><CardDescription>Estamos verificando a autenticidade do seu acesso.</CardDescription></CardHeader><CardContent><p className="gov-status-info" role="status">{message}</p><Link className="mt-6 inline-block font-semibold underline" href="/login">Ir para o login</Link></CardContent></Card></main><GovFooter /></div>;
}
export default function VerifyEmailPage() { return <Suspense fallback={<main className="p-8 text-center">Carregando...</main>}><VerifyEmailContent /></Suspense>; }
