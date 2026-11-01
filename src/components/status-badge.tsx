import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  pending: "Pendente",
  rejected: "Rejeitada",
  approved: "Aprovada",
  archived: "Arquivada",
  processing: "Em processamento",
};

const styles: Record<string, string> = {
  pending: "border-[#ffcd07] bg-[#fff5c2] text-[#333333]",
  rejected: "border-[#e52207] bg-[#fde0db] text-[#8b0a03]",
  approved: "border-[#168821] bg-[#e3f5e1] text-[#0b4b3f]",
  archived: "border-[#636363] bg-[#e6e6e6] text-[#333333]",
  processing: "border-[#155bcb] bg-[#d4e5ff] text-[#0c326f]",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={styles[status]}>{labels[status] || status}</Badge>;
}
