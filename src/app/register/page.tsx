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
import {
  registerUser,
  AdditionalData,
} from "@/services/authService";
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loader";
import ReCAPTCHA from "react-google-recaptcha";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";

const formSchema = z
  .object({
    fullname: z.string().min(2, {
      message: "Nome é obrigatório",
    }),
    registrationNumber: z.string().min(2, {
      message: "Matrícula é obrigatória",
    }),
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(8, {
      message: "A senha precisa ter no mínimo 8 caracteres",
    }),
    confirmPassword: z.string().min(8, {
      message: "Confirme sua senha",
    }),
    recaptchaToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

export default function RegisterPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE;
  const [loading, setLoading] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      email: "",
      registrationNumber: "",
      password: "",
      confirmPassword: "",
      recaptchaToken: "",
    },
    mode: "onBlur",
  });

  const handleRecaptchaChange = (value: string | null) => {
    setRecaptchaValue(value);
    form.setValue("recaptchaToken", value || "");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (recaptchaSiteKey && !recaptchaValue) {
      toast({
        variant: "destructive",
        title: "Validação reCAPTCHA é obrigatória.",
      });
      return;
    }

    setLoading(true);
    try {
      const additionalData: AdditionalData = {
        fullname: values.fullname,
        registrationNumber: values.registrationNumber,
      };

      const user = await registerUser(values.email, values.password, additionalData, values.recaptchaToken);
      
      if (user) {
        toast({
          title: 'Registrado com sucesso',
          description: 'Sua conta foi criada. Verifique seu e-mail para ativar sua conta.',
        });

        router.push('/login');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Falha ao registrar',
        description: (error as Error)?.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-auth-page">
      <GovPublicHeader />
      <main className="gov-auth-main py-10">
      <Card className="gov-auth-card">
        <CardHeader>
          <p className="gov-eyebrow">Primeiro acesso</p>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Preencha seus dados acadêmicos para iniciar o cadastro.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Campos do formulário */}
              <FormField
                control={form.control}
                name="fullname"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite seu nome completo"
                        autoComplete="name"
                        className={fieldState.error ? "text-red-500" : ""}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite sua matrícula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
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
                        autoComplete="new-password"
                        placeholder="Digite sua senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmação de Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirme sua senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {recaptchaSiteKey && (
                <div className="flex justify-center w-full">
                  <ReCAPTCHA
                    sitekey={recaptchaSiteKey}
                    onChange={handleRecaptchaChange}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <LoadingSpinner className="text-black" /> : "Registrar"}
              </Button>

              <Button
                type="button"
                className="w-full mt-2"
                variant={"ghost"}
                onClick={() => router.push('/login')}
              >
                Já tenho uma conta
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </main>
      <GovFooter />
    </div>
  );
}
