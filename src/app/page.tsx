import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";

export default function Home() {
  return (
    <div className="gov-page flex min-h-screen flex-col">
      <GovPublicHeader />
      <main id="main-content" className="flex-1">
        <section className="border-b border-[#cccccc] bg-white">
          <div className="container py-12 md:py-16">
            <div className="max-w-3xl">
              <p className="gov-eyebrow">Controle CC</p>
              <h1 className="text-[2.4rem] font-light leading-tight md:text-[3rem]">Atividades complementares de Ciência da Computação</h1>
              <p className="mt-5 text-lg leading-relaxed text-[#555555]">Envie seus comprovantes, acompanhe cada análise e consulte a carga horária aprovada em um único lugar.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg"><Link href="/login">Entrar <ArrowRight className="ml-2" size={18} /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/register">Criar conta</Link></Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <GovFooter />
    </div>
  );
}
