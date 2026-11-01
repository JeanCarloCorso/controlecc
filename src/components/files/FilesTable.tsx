import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FileBadge } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loader';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";


interface FilesTableProps {
  filesList: any[];
  loading: boolean;
  setDrawerVisibleView: (open: boolean) => void;
  setPdfPath: (path: string) => void;
  setPdfLoading: (loading: boolean) => void;
}

const FilesTable: React.FC<FilesTableProps> = ({
  filesList,
  loading,
  setDrawerVisibleView,
  setPdfPath,
  setPdfLoading,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Data de realização</TableHead>
          <TableHead>Data de envio</TableHead>
          <TableHead>Carga horária</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Arquivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center">
                <div className="flex items-center justify-center gap-3" aria-live="polite"><LoadingSpinner /> Carregando atividades…</div>
              </TableCell>
            </TableRow>
          ) : filesList.length > 0 ? (
            filesList?.map((file: any) => (
              <TableRow key={file.pathFile}>
                <TableCell>{file.name ?? 'Sem nome'}</TableCell>
                <TableCell>{file.description ?? 'Sem Descrição'}</TableCell>
                <TableCell>{file.completionDate ? new Date(`${file.completionDate}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não informada"}</TableCell>
                <TableCell className="font-medium">{file.createdAt?.seconds ? new Date(file.createdAt.seconds * 1000 + (file.createdAt.nanoseconds || 0) / 1000000).toLocaleString("pt-BR") : "Não informada"}</TableCell>
                <TableCell>{file.workload}h</TableCell>
                <TableCell>
                  <StatusBadge status={file.status} />
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label={`Visualizar arquivo de ${file.name || "atividade"}`}
                        variant={"ghost"}
                        onClick={() => {
                          setPdfLoading(true);
                          setDrawerVisibleView(true);
                          setPdfPath(file.pathFile)
                        }}
                      >
                        <FileBadge size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visualizar arquivo</TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="p-0"><EmptyState title="Nenhuma atividade cadastrada" description="Use o botão “Adicionar atividade” para enviar seu primeiro comprovante." /></TableCell>
            </TableRow>
          )}
      </TableBody>
    </Table>
  );
};

export default FilesTable; 
