import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loader';

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
          <DrawerTitle>Visualize seu arquivo</DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-hidden bg-[#f0f0f0]">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              className="h-full min-h-[55dvh] w-full"
              title="PDF Viewer"
              onLoad={() => setPdfLoading(false)}
              style={{ display: pdfLoading ? 'none' : 'block' }}
            />
          ) : (
            <div className="h-full w-full flex justify-center items-center"><LoadingSpinner className="bg-dark" /></div>
          )}
          {pdfLoading && (
            <div className="h-full w-full flex justify-center items-center"><LoadingSpinner className="bg-dark" /></div>
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
