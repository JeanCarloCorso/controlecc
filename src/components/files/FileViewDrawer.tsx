import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loader';
import { InlineFeedback } from '@/components/inline-feedback';

interface FileViewDrawerProps {
  drawerVisibleView: boolean;
  setDrawerVisibleView: (open: boolean) => void;
  pdfUrl: string | null;
  pdfLoading: boolean;
  setPdfLoading: (loading: boolean) => void;
}

const FileViewDrawer: React.FC<FileViewDrawerProps> = ({
  drawerVisibleView,
  setDrawerVisibleView,
  pdfUrl,
  pdfLoading,
  setPdfLoading
}) => {
  return (
    <Drawer open={drawerVisibleView} onOpenChange={setDrawerVisibleView}>
      <DrawerContent className="h-[92dvh]">
        <DrawerHeader>
          <DrawerTitle>Comprovante da atividade</DrawerTitle>
          <DrawerDescription>Confira o documento enviado. O arquivo é exibido somente para consulta.</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-hidden bg-[#f0f0f0]">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              className="h-full min-h-[55dvh] w-full"
              title="Comprovante da atividade em PDF"
              onLoad={() => setPdfLoading(false)}
              style={{ display: pdfLoading ? 'none' : 'block' }}
            />
          ) : pdfLoading ? (
            <div className="flex h-full w-full items-center justify-center gap-3" aria-live="polite"><LoadingSpinner /> Carregando documento…</div>
          ) : (
            <div className="mx-auto max-w-lg p-6"><InlineFeedback variant="error" title="Não foi possível exibir o documento" description="Feche a visualização e tente novamente." /></div>
          )}
          {pdfLoading && pdfUrl && (
            <div className="flex h-full w-full items-center justify-center gap-3" aria-live="polite"><LoadingSpinner /> Carregando documento…</div>
          )}
        </div>
        <DrawerFooter className="border-t bg-white sm:flex-row sm:justify-end">
          <DrawerClose asChild>
            <Button variant="outline">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FileViewDrawer; 
