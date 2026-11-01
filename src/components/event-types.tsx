import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from './ui/button';
import { Edit2Icon, Plus, Trash } from 'lucide-react';
import { LoadingSpinner } from './ui/loader';
import { collection, query, getDocs, addDoc, doc, setDoc, deleteDoc } from "@/lib/api-client";
import { database as db } from '@/lib/api-client';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/empty-state";
import { InlineFeedback } from "@/components/inline-feedback";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nome é obrigatório",
  }),
});

export default function EventTypes() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [editing, setEditing] = useState({
    status: false,
    id: ""
  });
  const [drawerVisibleForm, setDrawerVisibleForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function getUserInfo() {
      setInitialLoading(true);
      setLoadError(false);
      try {
        const q = query(collection(db, "eventTypes"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setCourses([]);
          return;
        }

        const arrayCourses: Array<any> = [];
        querySnapshot.forEach((doc) => {
          const course: any = doc.data()
          course.id = doc.id
          arrayCourses.push(course);
        });
        setCourses(arrayCourses);

      } catch (error) {
        console.error("Erro ao obter lista de arquivos:", error);
        setLoadError(true);
      } finally {
        setInitialLoading(false);
      }
    }
    getUserInfo();

  }, [drawerVisibleForm, alertVisible]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ""
    },
    mode: "onBlur",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      if (editing.status) {

        const docRef = doc(db, "eventTypes", editing.id);

        await setDoc(docRef, {
          name: values.name
        }, {
          merge: true
        });
        toast({ title: "Tipo de evento atualizado", description: "As alterações foram salvas com sucesso." });
        setDrawerVisibleForm(false);
        form.clearErrors();
        form.reset();

      } else {
        await addDoc(collection(db, "eventTypes"), { name: values.name });

        toast({
          title: "Tipo de evento cadastrado",
          description: "O tipo já pode ser usado nas atividades.",
        })

        setDrawerVisibleForm(false);
        form.clearErrors();
        form.reset();

      }



    } catch (e) {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar o tipo de evento",
        description: "Revise os dados e tente novamente.",
      })
    } finally {
      setLoading(false);
    }

  }

  async function onDelete() {
    setLoading(true);
    try {
      let docRef = doc(db, 'eventTypes', editing.id);

      await deleteDoc(docRef);
      setAlertVisible(false);
      toast({ title: "Tipo de evento excluído", description: "O registro foi removido com sucesso." });


    } catch (error) {
      toast({
        variant: "destructive",
        title: "Não foi possível excluir o tipo de evento",
        description: "Verifique se o tipo está em uso e tente novamente.",
      });

      setAlertVisible(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch pt-4">

      {loadError ? <div className="mb-4"><InlineFeedback variant="error" title="Não foi possível carregar os tipos de evento" description="Atualize a página ou tente novamente em alguns instantes." /></div> : null}

      <div className="flex justify-end pb-3">

        <Button
          variant={"default"}
          onClick={() => { setEditing({ status: false, id: "" }); form.reset({ name: "" }); setDrawerVisibleForm(true) }}
        >
          <Plus className="mr-2" size={16} aria-hidden="true" />

          Adicionar tipo de evento
        </Button>

      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Nome</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            initialLoading ? <TableRow><TableCell colSpan={2} className="py-10"><span className="flex items-center justify-center gap-3" aria-live="polite"><LoadingSpinner /> Carregando tipos de evento…</span></TableCell></TableRow> : courses?.length === 0 ? <TableRow><TableCell colSpan={2} className="p-0"><EmptyState title="Nenhum tipo de evento cadastrado" description="Adicione o primeiro tipo para classificá-lo nas atividades." /></TableCell></TableRow> : courses?.map((course: any) => (
              <TableRow key={course.id}>
                <TableCell>{course.name}</TableCell>
                <TableCell>
                  <div>
                    <Button
                      aria-label={`Editar tipo de evento ${course.name}`}
                      variant="ghost"
                      onClick={() => {
                        form.setValue("name", course.name);
                        setEditing({
                          status: true,
                          id: course.id
                        })
                        setDrawerVisibleForm(true)
                      }}
                    >
                      <Edit2Icon className="mr-2" size={16} aria-hidden="true" /> Editar
                    </Button>

                    <Button
                      aria-label={`Excluir tipo de evento ${course.name}`}
                      variant="ghost"
                      className="text-[#b50909]"
                      onClick={() => {
                        setAlertVisible(true)
                        setEditing({
                          status: false,
                          id: course.id
                        })
                      }}
                    >
                      <Trash className="mr-2" size={16} aria-hidden="true" /> Excluir
                    </Button>

                  </div>
                </TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>

      <AlertDialog
        open={alertVisible}
        onOpenChange={setAlertVisible}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este tipo de evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setAlertVisible(false) }}
            >Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-[#b50909]"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
            >
              {loading ? "Excluindo…" : "Excluir tipo de evento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer
        open={drawerVisibleForm}
        onOpenChange={setDrawerVisibleForm}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editing.status ? "Editar tipo de evento" : "Adicionar tipo de evento"}</DrawerTitle>
            <DrawerDescription>Use um nome claro e reconhecível para estudantes e administradores.</DrawerDescription>
          </DrawerHeader>
          <div className='overflow-y-auto px-4 pb-5 sm:px-6'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Nome do tipo de evento <span className="text-[#b50909]">(obrigatório)</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o tipo do evento"
                          className={fieldState.error ? "text-color-red" : ""}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DrawerFooter className="m-0 flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end">
                  <DrawerClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DrawerClose>
                  <Button type="submit" disabled={loading}>
                    {loading ? <><LoadingSpinner className="mr-2" /> Salvando…</> : editing.status ? "Salvar alterações" : "Adicionar tipo de evento"}
                  </Button>
                </DrawerFooter>
              </form>

            </Form>
          </div>

        </DrawerContent>
      </Drawer>

    </div>
  )
}
