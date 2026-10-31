import React from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from '@/components/ui/loader';

interface ValidationDrawerProps {
  drawerVisibleView: boolean;
  setDrawerVisibleView: (v: boolean) => void;
  pdfUrl: string;
  pdfLoading: boolean;
  formValidation: any;
  setFormValidation: (v: any) => void;
  updateStatus: () => void;
  setAlertVisible: (v: any) => void;
  currentFile: any;
}

const ValidationDrawer: React.FC<ValidationDrawerProps> = ({
  drawerVisibleView,
  setDrawerVisibleView,
  pdfUrl,
  pdfLoading,
  formValidation,
  setFormValidation,
  updateStatus,
  setAlertVisible,
  currentFile,
}) => {
  return (
    <Drawer open={drawerVisibleView} onOpenChange={setDrawerVisibleView}>
      <DrawerTrigger asChild></DrawerTrigger>
      <DrawerContent className="h-[92dvh]">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">Validar atividade</DrawerTitle>
          {currentFile?.user?.fullname && <p className="text-sm text-[#555555]">Documento enviado por <strong>{currentFile.user.fullname}</strong></p>}
        </DrawerHeader>
        <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:overflow-hidden">
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-1/4 lg:overflow-y-auto">
            <Label htmlFor="workload">Carga horária aprovada</Label>
            <Input
              type="number"
              min="1"
              placeholder="Carga Horária"
              value={formValidation.workload}
              onChange={(e) => setFormValidation({ ...formValidation, workload: e.target.value })}
            />
            <Label htmlFor="status">Status</Label>
            <Select
              onValueChange={(value) => setFormValidation({ ...formValidation, status: value })}
              value={formValidation.status}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="observation">Observação para o estudante</Label>
            <Input
              type="text"
              placeholder="Explique a decisão ou informe os ajustes necessários"
              value={formValidation.observation}
              onChange={(e) => setFormValidation({ ...formValidation, observation: e.target.value })}
            />
          </div>
          <div className="flex min-h-[45dvh] w-full items-center justify-center overflow-hidden rounded-sm border bg-[#f0f0f0] lg:h-full lg:min-h-0 lg:w-3/4">
            {pdfUrl && !pdfLoading ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                style={{ minHeight: "400px", height: "100%", width: "100%" }}
                title="PDF Viewer"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex justify-center items-center">
                <LoadingSpinner className="bg-dark" />
              </div>
            )}
          </div>
        </div>
        <DrawerFooter className="flex flex-col-reverse gap-2 border-t bg-white sm:flex-row sm:justify-end">
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
          </DrawerClose>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setAlertVisible({ visible: true, id: currentFile.id });
              }}
            >
              Salvar
            </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default React.memo(ValidationDrawer); 
