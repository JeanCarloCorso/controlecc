"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loader";
import { toast } from "@/hooks/use-toast";
import { InlineFeedback } from "@/components/inline-feedback";

const formSchema = z.object({
  password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"], message: "As senhas não coincidem",
});

function ResetPasswordContent() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      toast({ variant: "destructive", title: "Link inválido", description: "Solicite um novo link de redefinição de senha." });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth-tokens/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível alterar a senha");
      form.reset();
      toast({ title: "Senha alterada com sucesso", description: "Você já pode entrar com a nova senha." });
      router.replace("/login");
    } catch (error) {
      toast({ variant: "destructive", title: "Não foi possível alterar a senha", description: error instanceof Error ? error.message : "Tente novamente em instantes." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gov-auth-page">
      <GovPublicHeader />
      <main id="main-content" className="gov-auth-main">
        <Card className="gov-auth-card">
          <CardHeader><p className="gov-eyebrow">Segurança da conta</p><CardTitle as="h1">Redefinir senha</CardTitle><CardDescription>Crie uma nova senha com no mínimo oito caracteres.</CardDescription></CardHeader>
          <CardContent>
            {!token ? (
              <InlineFeedback variant="error" title="Link de redefinição inválido" description="O token está ausente. Solicite um novo link na página de entrada." />
            ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Nova senha</FormLabel><FormControl><Input type="password" autoComplete="new-password" placeholder="Digite a nova senha" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirmação da nova senha</FormLabel><FormControl><Input type="password" autoComplete="new-password" placeholder="Confirme a nova senha" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button className="w-full" type="submit" disabled={loading}>{loading ? <><LoadingSpinner className="mr-2" /> Salvando…</> : "Salvar nova senha"}</Button>
              </form>
            </Form>
            )}
            <Link className="mt-6 inline-block font-semibold underline" href="/login">Voltar para o login</Link>
          </CardContent>
        </Card>
      </main>
      <GovFooter />
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="p-8 text-center">Carregando...</main>}><ResetPasswordContent /></Suspense>;
}
