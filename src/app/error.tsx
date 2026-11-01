"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="gov-auth-page flex min-h-screen flex-col">
      <GovPublicHeader />
      <main id="main-content" className="gov-auth-main flex-1 text-center">
        <div className="max-w-xl">
          <AlertTriangle className="mx-auto mb-5 text-[#e52207]" size={52} aria-hidden="true" />
          <p className="gov-eyebrow">Falha inesperada</p>
          <h1 className="text-4xl font-light">Não foi possível abrir esta página</h1>
          <p className="mt-4 text-base text-[#555555]">Tente novamente. Se o problema continuar, volte mais tarde.</p>
          <Button className="mt-7" onClick={reset}>Tentar novamente</Button>
        </div>
      </main>
      <GovFooter />
    </div>
  );
}
