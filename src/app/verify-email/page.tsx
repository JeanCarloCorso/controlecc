"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineFeedback } from "@/components/inline-feedback";
function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const [result, setResult] = useState<{ state: "loading" | "success" | "error"; message: string }>({ state: "loading", message: "Aguarde enquanto validamos seu link." });
  useEffect(() => {
    if (!token) {
      setResult({ state: "error", message: "O token de confirmação está ausente. Solicite um novo e-mail de confirmação." });
      return;
    }
    fetch("/api/auth-tokens/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async response => {
        const body = await response.json();
        setResult(response.ok
          ? { state: "success", message: "Seu e-mail foi confirmado. Você já pode entrar no sistema." }
          : { state: "error", message: body.error || "O link é inválido ou expirou." });
      })
      .catch(() => setResult({ state: "error", message: "Não foi possível concluir a confirmação. Tente novamente em instantes." }));
  }, [token]);
  return <div className="gov-auth-page"><GovPublicHeader /><main id="main-content" className="gov-auth-main"><Card className="gov-auth-card"><CardHeader><p className="gov-eyebrow">Validação de cadastro</p><CardTitle as="h1">Confirmação de e-mail</CardTitle><CardDescription>Verifique abaixo o resultado da confirmação da sua conta.</CardDescription></CardHeader><CardContent><InlineFeedback variant={result.state === "success" ? "success" : result.state === "error" ? "error" : "info"} title={result.state === "loading" ? "Confirmando seu e-mail" : result.state === "success" ? "E-mail confirmado" : "Não foi possível confirmar o e-mail"} description={result.message} /><Link className="mt-6 inline-block font-semibold underline" href="/login">Ir para o login</Link></CardContent></Card></main><GovFooter /></div>;
}
export default function VerifyEmailPage() { return <Suspense fallback={<main className="p-8 text-center">Carregando...</main>}><VerifyEmailContent /></Suspense>; }
