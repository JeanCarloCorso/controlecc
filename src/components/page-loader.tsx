import { LoadingSpinner } from "@/components/ui/loader";

export function PageLoader({ label = "Carregando informações..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-4" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5ff] text-[#1351b4]">
          <LoadingSpinner />
        </span>
        <div>
          <p className="font-semibold text-[#333333]">{label}</p>
          <p className="mt-1 text-sm text-[#636363]">Isso deve levar apenas alguns instantes.</p>
        </div>
      </div>
    </main>
  );
}
