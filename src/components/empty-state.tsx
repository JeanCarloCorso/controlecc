import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-5 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5ff] text-[#1351b4]" aria-hidden="true">
        <Inbox size={24} />
      </span>
      <p className="font-semibold text-[#333333]">{title}</p>
      <p className="mt-1 max-w-lg text-sm text-[#555555]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
