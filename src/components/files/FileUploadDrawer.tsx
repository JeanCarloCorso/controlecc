import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { Plus, CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loader';
import { Textarea } from '@/components/ui/textarea';

interface FileUploadDrawerProps {
  drawerVisibleForm: boolean;
  setDrawerVisibleForm: (open: boolean) => void;
  form: any;
  onSubmit: (values: any) => void;
  loading: boolean;
}

const FileUploadDrawer: React.FC<FileUploadDrawerProps> = ({
  drawerVisibleForm,
  setDrawerVisibleForm,
  form,
  onSubmit,
  loading
}) => {
  const fileRef = form.register("file", { required: true });
  return (
    <Drawer open={drawerVisibleForm} onOpenChange={setDrawerVisibleForm}>
      <DrawerTrigger asChild>
        <Button
          onClick={() => setDrawerVisibleForm(true)}
        >
          <Plus className="mr-2" size={16} aria-hidden="true" />
          Adicionar atividade
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Adicionar atividade</DrawerTitle>
          <DrawerDescription>Arquivos duplicados são verificados automaticamente. Envie documentos em PDF.</DrawerDescription>
        </DrawerHeader>
        <div className='overflow-y-auto px-4 pb-5 sm:px-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Nome da atividade <span className="text-[#b50909]">(obrigatório)</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome da atividade"
                        className={fieldState.error ? "text-color-red" : ""}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Descrição da atividade <span className="text-[#b50909]">(obrigatório)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a atividade e sua relação com a formação acadêmica"
                        className={fieldState.error ? "text-color-red" : ""}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workload"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Carga horária <span className="text-[#b50909]">(obrigatório)</span></FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min="1"
                        step="1"
                        placeholder="Digite a carga horária em horas"
                        className={fieldState.error ? "text-color-red" : ""}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="completionDate"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de realização <span className="text-[#b50909]">(obrigatório)</span></FormLabel>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>Comprovante em PDF <span className="text-[#b50909]">(obrigatório)</span></FormLabel>
                    <FormControl>
                      <Input
                        {...fileRef}
                        type="file"
                        accept="application/pdf"
                        className="h-auto cursor-pointer py-3 file:mr-3 file:rounded-full file:bg-[#edf5ff] file:px-3 file:py-1 file:text-[#1351b4]"
                      />
                    </FormControl>
                    <FormDescription>Somente PDF, com tamanho máximo de 5 MB.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DrawerFooter className="m-0 flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end">
                <DrawerClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DrawerClose>
                <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                  {loading ? <><LoadingSpinner className="mr-2" /> Enviando…</> : "Enviar para validação"}
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FileUploadDrawer; 
