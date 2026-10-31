import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, ChevronDown, UserCircle } from 'lucide-react';

const ResponsiveMenu: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const navClass = (href: string) =>
    `min-h-11 border-b-4 px-2 py-3 text-sm font-semibold no-underline transition-colors ${
      pathname === href
        ? "border-[#1351b4] text-[#1351b4]"
        : "border-transparent text-[#333333] hover:bg-[#edf5ff] hover:text-[#1351b4]"
    }`;

  if (session) {
    return (
      <header className="sticky top-0 z-50 border-b border-[#cccccc] bg-white shadow-[0_1px_4px_rgba(0,0,0,.12)]">
        <nav className="container" aria-label="Navegação principal">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-x-4 pt-3 md:flex-nowrap md:py-0">
            <div className="contents md:flex md:min-w-0 md:items-center md:gap-5">
              <Link href="/dashboard" className="flex shrink-0 items-center gap-3 no-underline" aria-label="Controle CC - painel geral">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#071d41] text-white"><BookOpen size={20} /></span>
                <span className="hidden leading-tight lg:block">
                  <strong className="block text-base text-[#333333]">Controle CC</strong>
                  <span className="text-xs text-[#555555]">Ciência da Computação</span>
                </span>
              </Link>
              <div className="order-3 -mx-4 mt-2 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto border-t border-[#e6e6e6] px-4 md:order-none md:mx-0 md:mt-0 md:w-auto md:border-0 md:px-0">
              {session?.user.role === "admin" && (
                <Link href="/dashboard" className={navClass("/dashboard")}>
                  Painel Geral
                </Link>
              )}
              {session?.user.role === "admin" && (
                <Link href="/validation" className={navClass("/validation")}>
                  Validações
                </Link>
              )}
              {session?.user.role === "admin" && (
                <Link href="/users" className={navClass("/users")}>
                  Usuários
                </Link>
              )}
              {session?.user.role !== "admin" && (
                <Link href="/files" className={navClass("/files")}>
                  Atividades
                </Link>
              )}
              </div>
            </div>
            <div className="order-2 shrink-0 md:order-none">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex min-h-10 items-center justify-center rounded-full px-3 text-[#1351b4] hover:bg-[#edf5ff]"
                  aria-label="Abrir menu de usuário"
                >
                  <UserCircle size={20} className='mr-2' />
                  <div className="hidden md:block">
                    {
                      session?.user?.name?.split(" ")[0] || "Usuário"
                    }
                  </div>
                  <ChevronDown size={14} className='ml-2' />
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  {
                    session?.user.role === "admin" && (
                      
                      <DropdownMenuItem onClick={() => router.push("/adminpanel")}>
                        Painel administrativo
                      </DropdownMenuItem>
                    )
                  }
                  <DropdownMenuSeparator />

                  {
                    session?.user.role !== "admin" && (
                      <>
                        <DropdownMenuItem onClick={() => router.push("/myprogress")}>
                          Meu Progresso
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                      </>
                    )
                  }


                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        </nav>
        <div className="h-1 bg-[#1351b4]" />
      </header>
    );
  }
};

export default ResponsiveMenu;
