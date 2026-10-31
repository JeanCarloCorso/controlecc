import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GovFooter, GovPublicHeader } from "@/components/gov-public-header";

export default function Home() {
  return (
    <div className="gov-page">
      <GovPublicHeader />
      <main>
        <section className="border-b border-[#cccccc] bg-white">
          <div className="container py-12 md:py-16">
            <div className="max-w-3xl">
              <p className="gov-eyebrow">Controle CC</p>
              <h1 className="text-[2.4rem] font-light leading-tight md:text-[3rem]">Controle de atividades complementares</h1>
              <p className="mt-5 text-lg leading-relaxed text-[#555555]">Sistema do curso de Ciência da Computação para envio e validação de comprovantes de atividades complementares.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg"><Link href="/login">Entrar <ArrowRight className="ml-2" size={18} /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/register">Criar conta</Link></Button>
              </div>
            </div>
          </div>
        </section>
        <section className="container py-10 md:py-12" aria-labelledby="sobre-sistema">
          <div className="max-w-3xl rounded-sm border border-[#cccccc] bg-white p-6 md:p-8">
            <h2 id="sobre-sistema" className="text-2xl font-semibold">Neste sistema você pode</h2>
            <ul className="mt-5 space-y-4">
              {[
                "Enviar certificados e outros comprovantes em PDF.",
                "Acompanhar a situação das atividades enviadas.",
                "Consultar a carga horária aprovada.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-[#333333]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[#168821]" size={20} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <GovFooter />
    </div>
  );
}
