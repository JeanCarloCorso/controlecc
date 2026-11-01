"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  useEffect(() => {
    if (!token) {
      toast({ variant: "destructive", title: "Não foi possível confirmar o e-mail", description: "Token de confirmação ausente." });
      return;
    }
    fetch("/api/auth-tokens/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async response => {
        const body = await response.json();
        toast(response.ok
          ? { title: "E-mail confirmado", description: "Você já pode entrar no sistema." }
          : { variant: "destructive", title: "Não foi possível confirmar o e-mail", description: body.error });
      })
      .catch(() => toast({ variant: "destructive", title: "Não foi possível confirmar o e-mail", description: "Tente novamente em instantes." }));
  }, [token]);
  return <div className="gov-auth-page"><GovPublicHeader /><main className="gov-auth-main"><Card className="gov-auth-card"><CardHeader><p className="gov-eyebrow">Validação de cadastro</p><CardTitle>Confirmação de e-mail</CardTitle><CardDescription>A confirmação será exibida em uma notificação.</CardDescription></CardHeader><CardContent><Link className="inline-block font-semibold underline" href="/login">Ir para o login</Link></CardContent></Card></main><GovFooter /></div>;
}
export default function VerifyEmailPage() { return <Suspense fallback={<main className="p-8 text-center">Carregando...</main>}><VerifyEmailContent /></Suspense>; }
