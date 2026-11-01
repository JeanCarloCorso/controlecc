import Link from "next/link";
import { SearchX } from "lucide-react";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="gov-auth-page flex min-h-screen flex-col">
      <GovPublicHeader />
      <main id="main-content" className="gov-auth-main flex-1 text-center">
        <div className="max-w-xl">
          <SearchX className="mx-auto mb-5 text-[#1351b4]" size={52} aria-hidden="true" />
          <p className="gov-eyebrow">Erro 404</p>
          <h1 className="text-4xl font-light">Página não encontrada</h1>
          <p className="mt-4 text-base text-[#555555]">O endereço pode estar incorreto ou a página pode ter sido movida.</p>
          <Button asChild className="mt-7"><Link href="/">Voltar à página inicial</Link></Button>
        </div>
      </main>
      <GovFooter />
    </div>
  );
}
