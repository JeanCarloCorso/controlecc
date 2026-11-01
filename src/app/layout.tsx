import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils"
import { ClientProviders } from "@/components/client-provider";
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: "Controle CC | Ciência da Computação",
    template: "%s | Controle CC",
  },
  description: "Sistema de gestão de atividades complementares do curso de Ciência da Computação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <body
        className={
          cn(
            "min-h-screen bg-background antialiased"
          )
        }
      >
        <a className="gov-skip-link" href="#main-content">Ir para o conteúdo principal</a>
        <ClientProviders>
          {children}
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
