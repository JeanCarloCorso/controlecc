"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import PasswordResetComponent from "@/components/password-reset";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";

const formSchema = z.object({
  email: z.string().email({ message: "Informe um e-mail válido" }),
  password: z.string().min(6, {
    message: "A senha precisa ter no mínimo 6 caracteres",
  }),
});

/**
 * Componente que renderiza a página de login
 * @returns {JSX.Element} JSX element
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      // Cria a sessão com NextAuth
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {

        (result);
        
        setLoading(false);
        toast({
          title: 'Erro ao criar sessão',
            description: "E-mail ou senha incorretos. Confira os dados e tente novamente.",
          variant: 'destructive',
        })
      } else {
        // toast({
        //   title: 'Sessão criada com sucesso',
        // })
        const session = await getSession();
        router.push(session?.user?.role === "admin" ? "/dashboard" : "/myprogress");
        router.refresh();
      }
    } catch (error: any) {

      setLoading(false);
      console.error('Erro ao fazer login:', error);
      toast({
        variant: "destructive",
        title: "Não foi possível entrar",
        description: "Ocorreu uma falha inesperada. Tente novamente em instantes.",
      });
    }
  }

  return (
    <div className="gov-auth-page">
      <GovPublicHeader />
      <main id="main-content" className="gov-auth-main">
      <Card className="gov-auth-card">
        <CardHeader>
          <p className="gov-eyebrow">Acesso ao sistema</p>
          <CardTitle as="h1">Entrar</CardTitle>
          <CardDescription>Informe seus dados para acessar o Controle CC.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="nome@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><LoadingSpinner className="mr-2"/> Entrando…</> : "Entrar"}
              </Button>
              <div className="flex w-full flex-col items-center justify-between gap-2 sm:flex-row">
              
              <PasswordResetComponent />
              <Button type="button" variant="ghost" onClick={() => router.push('/register')}>
                Criar conta
              </Button>

              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </main>
      <GovFooter />
    </div>
  );
}
