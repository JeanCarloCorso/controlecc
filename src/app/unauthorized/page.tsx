import React from 'react';
import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { GovFooter, GovPublicHeader } from '@/components/gov-public-header';
import { Button } from '@/components/ui/button';

const Unauthorized = () => {
    return (
      <div className="gov-auth-page">
        <GovPublicHeader />
        <main id="main-content" className="gov-auth-main text-center"><div className="max-w-xl"><ShieldX className="mx-auto mb-5 text-[#e52207]" size={52} aria-hidden="true" /><p className="gov-eyebrow">Erro 403</p><h1 className="text-4xl font-light">Acesso negado</h1><p className="mt-4 text-base text-[#555555]">Seu perfil não possui permissão para acessar esta página.</p><Button asChild className="mt-7"><Link href="/dashboard">Voltar à página inicial</Link></Button></div></main>
        <GovFooter />
      </div>
    );
  };
  
  export default Unauthorized;
