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
import { signIn } from 'next-auth/react';
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

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
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
  const [error, setError] = useState<string | null>(null);
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
          description: "Email ou senha incorretos! Tente novamente.",
          variant: 'destructive',
        })
      } else {
        // toast({
        //   title: 'Sessão criada com sucesso',
        // })
        router.push('/dashboard');
      }
    } catch (error: any) {

      setLoading(false);
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login: ' + error.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 m-2">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Acesse agora sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Digite seu email"
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
                        placeholder="Digite sua senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <LoadingSpinner className="text-black"/> : "Entrar"}
              </Button>
              <div className="w-full flex items-center justify-between">
              
              <PasswordResetComponent />
              <Button type="button" className="px-5 py-0" style={{ marginTop: 5 }} variant={"ghost"} onClick={() => router.push('/register')}>
                Registre-se
              </Button>

              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
