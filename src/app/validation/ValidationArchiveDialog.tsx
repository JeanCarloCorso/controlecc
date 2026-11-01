import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ValidationArchiveDialogProps {
  showArchiveDialog: boolean;
  setShowArchiveDialog: (v: boolean) => void;
  handleArchiveFile: () => void;
}

const ValidationArchiveDialog: React.FC<ValidationArchiveDialogProps> = ({
  showArchiveDialog,
  setShowArchiveDialog,
  handleArchiveFile,
}) => {
  return (
    <AlertDialog open={showArchiveDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar atividade</AlertDialogTitle>
          <AlertDialogDescription>
            A atividade deixará de aparecer na listagem padrão, mas continuará disponível nos filtros de arquivadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowArchiveDialog(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-[#b50909]" onClick={handleArchiveFile}>
            Arquivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default React.memo(ValidationArchiveDialog);
