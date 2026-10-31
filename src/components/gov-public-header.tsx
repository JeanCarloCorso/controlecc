import Link from "next/link";
import { BookOpen, LogIn } from "lucide-react";

export function GovPublicHeader() {
  return (
    <header className="border-b border-[#cccccc] bg-white shadow-[0_1px_4px_rgba(0,0,0,.12)]">
      <div className="container flex min-h-20 items-center justify-between gap-4 py-3">
        <Link href="/" className="group flex items-center gap-3 no-underline" aria-label="Controle CC - página inicial">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071d41] text-white">
            <BookOpen aria-hidden="true" size={22} />
          </span>
          <span className="leading-tight">
            <strong className="block text-lg font-semibold text-[#333333]">Controle CC</strong>
            <span className="hidden text-xs text-[#555555] sm:block">Ciência da Computação</span>
          </span>
        </Link>
        <Link href="/login" className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 font-semibold text-[#1351b4] hover:bg-[#edf5ff]">
          <LogIn aria-hidden="true" size={18} />
          Entrar
        </Link>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#1351b4] via-[#168821] to-[#ffcd07]" />
    </header>
  );
}

export function GovFooter() {
  return (
    <footer className="bg-[#071d41] text-white">
      <div className="container flex flex-col gap-1 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <strong>Controle CC</strong>
        <span className="text-[#c5d4eb]">Instituto Federal Catarinense</span>
      </div>
    </footer>
  );
}
