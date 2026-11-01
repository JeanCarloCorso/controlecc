import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileBadge, FileDownIcon, ArchiveIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoadingSpinner } from "@/components/ui/loader";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

interface ValidationTableProps {
  filteredFilesList: any[];
  loading: boolean;
  downloadLoadingFiles: Record<string, boolean>;
  setDrawerVisibleView: (v: boolean) => void;
  setPdfPath: (v: string) => void;
  setPdfLoading: (v: boolean) => void;
  setCurrentFile: (v: any) => void;
  setFormValidation: (v: any) => void;
  handleOpenPdf: (path: string, uid: string) => void;
  setShowArchiveDialog: (v: boolean) => void;
  statuses: Record<string, string>;
}

const ValidationTable: React.FC<ValidationTableProps> = ({
  filteredFilesList,
  loading,
  downloadLoadingFiles,
  setDrawerVisibleView,
  setPdfPath,
  setPdfLoading,
  setCurrentFile,
  setFormValidation,
  handleOpenPdf,
  setShowArchiveDialog,
  statuses,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Aluno</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Data de envio</TableHead>
          <TableHead>Carga horária</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center">
              <div className="flex w-full items-center justify-center gap-3" aria-live="polite">
                <LoadingSpinner /> Carregando atividades…
              </div>
            </TableCell>
          </TableRow>
        ) : filteredFilesList.length > 0 ? (
          filteredFilesList.map((file: any) => (
            <TableRow key={file.pathFile}>
              <TableCell>{file.user.fullname}</TableCell>
              <TableCell>{file.description}</TableCell>
              <TableCell className="font-medium">
                {file.createdAt && typeof file.createdAt.seconds === "number"
                  ? new Date(
                      file.createdAt.seconds * 1000 +
                        (file.createdAt.nanoseconds
                          ? file.createdAt.nanoseconds / 1000000
                          : 0)
                    ).toLocaleString("pt-BR")
                  : "Data não disponível"}
              </TableCell>
              <TableCell>{file.workload}h</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <StatusBadge status={file.archived ? "archived" : file.status} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={`Validar arquivo de ${file.user.fullname}`}
                      variant={"ghost"}
                      onClick={() => {
                        setDrawerVisibleView(true);
                        setPdfPath(file.pathFile);
                        setPdfLoading(true);
                        setCurrentFile(file);
                        setFormValidation({
                          status: file.status,
                          workload: file.workload,
                          observation: file.observation || "",
                        });
                      }}
                    >
                      <FileBadge size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Validar arquivo</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={`Baixar arquivo de ${file.user.fullname}`}
                      variant={"ghost"}
                      disabled={downloadLoadingFiles[file.uid] || false}
                      onClick={() => {
                        setCurrentFile(file);
                        handleOpenPdf(file.pathFile, file.uid);
                      }}
                    >
                      {downloadLoadingFiles[file.uid] ? (
                        <LoadingSpinner className="bg-dark" />
                      ) : (
                        <FileDownIcon size={18} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Baixar arquivo</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={`Arquivar arquivo de ${file.user.fullname}`}
                      variant="ghost"
                      disabled={file.status !== "approved" || file.archived}
                      onClick={() => {
                        if (file.status !== "approved" || file.archived) return;
                        setCurrentFile(file);
                        setShowArchiveDialog(true);
                      }}
                    >
                      <ArchiveIcon
                        size={18}
                        aria-hidden="true"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {file.status !== "approved" && !file.archived
                      ? "Arquivo não aprovado"
                      : file.archived
                      ? "Arquivo já arquivado"
                      : "Arquivar arquivo"}
                  </TooltipContent>
                </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="p-0"><EmptyState title="Nenhuma atividade encontrada" description="Revise os filtros aplicados ou aguarde novos envios dos estudantes." /></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default React.memo(ValidationTable);
