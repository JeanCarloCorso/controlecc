import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { FileBadge } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loader';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const statuses: any = {
  "pending": "Pendente",
  "rejected": "Rejeitado",
  "approved": "Aprovado",
  "processing": "Processando",
}
const statusClasses: Record<string, string> = {
  pending: "border-[#ffcd07] bg-[#fff5c2] text-[#333333]",
  rejected: "border-[#e52207] bg-[#fde0db] text-[#8b0a03]",
  approved: "border-[#168821] bg-[#e3f5e1] text-[#0b4b3f]",
  processing: "border-[#155bcb] bg-[#d4e5ff] text-[#0c326f]",
};

interface FilesTableProps {
  filesList: any[];
  loading: boolean;
  setDrawerVisibleView: (open: boolean) => void;
  setPdfPath: (path: string) => void;
  drawerVisibleView: boolean;
  pdfUrl: string | null;
  pdfLoading: boolean;
  setPdfLoading: (loading: boolean) => void;
  setPdfUrl: (url: string | null) => void;
  setFilesList: (files: any[]) => void;
}

const FilesTable: React.FC<FilesTableProps> = ({
  filesList,
  loading,
  setDrawerVisibleView,
  setPdfPath,
  drawerVisibleView,
  pdfUrl,
  pdfLoading,
  setPdfLoading,
  setPdfUrl,
  setFilesList,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Data de realização</TableHead>
          <TableHead>Data de envio</TableHead>
          <TableHead>Carga Horaria</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Arquivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filesList.length > 0
          ? loading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center">
                <div className=" flex align-center justify-center"><LoadingSpinner className="bg-dark" /></div>
              </TableCell>
            </TableRow>
          ) : (
            filesList?.map((file: any) => (
              <TableRow key={file.pathFile}>
                <TableCell>{file.name ?? 'Sem nome'}</TableCell>
                <TableCell>{file.description ?? 'Sem Descrição'}</TableCell>
                <TableCell>{file.completionDate ? new Date(file.completionDate).toLocaleDateString() : "Sem data de realização"}</TableCell>
                <TableCell className="font-medium">{new Date(file.createdAt.seconds * 1000 + file.createdAt.nanoseconds / 1000000).toLocaleString()}</TableCell>
                <TableCell>{file.workload}h</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusClasses[file.status]}>{statuses[file.status] || file.status}</Badge>
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
              <TableCell colSpan={7} className="py-10 text-center text-[#555555]">
                Nenhuma atividade cadastrada.
              </TableCell>
            </TableRow>
          )
        }
      </TableBody>
    </Table>
  );
};

export default FilesTable; 
