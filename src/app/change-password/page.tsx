"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ResponsiveMenu from "@/components/responsive-menu";
import withAuthorization from "@/components/with-authorization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loader";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual"),
  newPassword: z.string().min(8, "A nova senha precisa ter no mínimo 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirme a nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"], message: "As senhas não coincidem",
}).refine((data) => data.currentPassword !== data.newPassword, {
  path: ["newPassword"], message: "A nova senha deve ser diferente da senha atual",
});

function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível alterar a senha");
      toast({ title: "Senha alterada com sucesso", description: "Entre novamente usando sua nova senha." });
      window.setTimeout(() => signOut({ callbackUrl: "/login" }), 1200);
    } catch (error) {
      toast({ variant: "destructive", title: "Não foi possível alterar a senha", description: error instanceof Error ? error.message : "Tente novamente em instantes." });
      setLoading(false);
    }
  }

  return (
    <div className="gov-page">
      <ResponsiveMenu />
      <main className="container py-8 md:py-10">
        <div className="gov-page-heading"><h1>Alterar senha</h1><p>Confirme sua identidade e defina uma nova senha de acesso.</p></div>
        <Card className="max-w-xl border-t-4 border-t-[#1351b4]">
          <CardHeader><CardTitle>Segurança da conta</CardTitle><CardDescription>Após a alteração, você precisará entrar novamente.</CardDescription></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="currentPassword" render={({ field }) => (
                  <FormItem><FormLabel>Senha atual</FormLabel><FormControl><Input type="password" autoComplete="current-password" placeholder="Digite sua senha atual" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="newPassword" render={({ field }) => (
                  <FormItem><FormLabel>Nova senha</FormLabel><FormControl><Input type="password" autoComplete="new-password" placeholder="Digite a nova senha" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirmação da nova senha</FormLabel><FormControl><Input type="password" autoComplete="new-password" placeholder="Confirme a nova senha" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={loading}>{loading ? <LoadingSpinner className="text-black" /> : "Alterar senha"}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default withAuthorization(ChangePasswordPage, ["admin", "common"]);
