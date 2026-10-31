import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils"
import { ClientProviders } from "@/components/client-provider";
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Controle CC",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={
          cn(
            "min-h-screen bg-background font-sans antialiased"
          )
        }
      >
        <ClientProviders>
          {children}
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
