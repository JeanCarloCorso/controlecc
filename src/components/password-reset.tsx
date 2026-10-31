"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, RotateCcw } from "lucide-react";
import { sendPasswordReset } from "@/services/passwordReset";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({ message: "Informe um e-mail válido." }),
});

export default function PasswordResetComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await sendPasswordReset(data.email);
      toast({
        title: "E-mail enviado",
        description: "Se o endereço estiver cadastrado, você receberá as instruções para criar uma nova senha.",
      });
      form.reset();
      setIsOpen(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível enviar o e-mail",
        description: "Verifique o endereço informado e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setIsOpen(true)}>
        <RotateCcw className="mr-2" size={16} />
        Esqueci minha senha
      </Button>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="mx-auto w-full max-w-xl">
            <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#edf5ff] text-[#1351b4]">
              <Mail size={22} aria-hidden="true" />
            </span>
            <DrawerTitle>Redefinir senha</DrawerTitle>
            <DrawerDescription>Informe o e-mail da sua conta. Enviaremos um link seguro para você criar uma nova senha.</DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full max-w-xl space-y-5 overflow-y-auto px-4 pb-6 sm:px-6">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input type="email" autoComplete="email" placeholder="nome@exemplo.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DrawerFooter className="flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end">
                <DrawerClose asChild><Button type="button" variant="outline">Cancelar</Button></DrawerClose>
                <Button type="submit" disabled={loading}>
                  {loading ? <><LoadingSpinner className="mr-2" /> Enviando...</> : "Enviar link"}
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
