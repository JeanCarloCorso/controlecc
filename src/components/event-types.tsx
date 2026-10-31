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
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
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
import { collection, query, getDocs, addDoc, serverTimestamp, doc, setDoc, deleteDoc } from "@/lib/api-client";
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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nome é obrigatório",
  }),
});

export default function EventTypes() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [editing, setEditing] = useState({
    status: false,
    id: ""
  });
  const [drawerVisibleForm, setDrawerVisibleForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function getUserInfo() {
      try {
        const q = query(collection(db, "eventTypes"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return;
        }

        querySnapshot.forEach((doc) => {
          const arrayCourses: Array<any> = [];

          querySnapshot.forEach((doc) => {
            let course: any = doc.data()
            course.id = doc.id
            arrayCourses.push(course);
          });

          setCourses(arrayCourses);
        });

      } catch (error) {
        console.error("Erro ao obter lista de arquivos:", error);
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

        setDoc(docRef, {
          name: values.name
        }, {
          merge: true
        }).then(() => {
          toast({
            title: "Tipo de evento atualizado com sucesso!",
          })

          setLoading(false);
          setDrawerVisibleForm(false);
          form.clearErrors();
          form.reset();

        });

      } else {


        let data: any = values;

        data.createdAt = serverTimestamp();

        const docRef = await addDoc(collection(db, "eventTypes"), data);

        toast({
          title: "Tipo de evento cadastrado com sucesso!",
        })

        setLoading(false);
        setDrawerVisibleForm(false);
        form.clearErrors();
        form.reset();

      }



    } catch (e) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Falha ao cadastrar Tipo de evento! Tente novamente.",
      })
    }

  }

  async function onDelete() {
    try {
      let docRef = doc(db, 'eventTypes', editing.id);

      await deleteDoc(docRef)
        .then(() => {

          setAlertVisible(false);

          toast({
            title: "Tipo de evento deletado com sucesso!",
          });


          setLoading(false)
        })


    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao excluir Tipo de evento! Tente novamente",
      });

      setAlertVisible(false);
    }
  }

  return (
    <div className="pt-4 flex flex-col items-end">

      <div className="pb-3">

        <Button
          variant={"default"}
          onClick={() => { setDrawerVisibleForm(true) }}
        >
          <Plus size={16} />

          Tipo de evento
        </Button>

      </div>

      <Table
        className="border"
      >
        <TableHeader>
          <TableRow>
            <TableHead className="">Nome</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            courses?.map((course: any) => (
              <TableRow key={course.name}>
                <TableCell>{course.name}</TableCell>
                <TableCell>
                  <div>
                    <Button
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
                      <Edit2Icon size={14} />
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAlertVisible(true)
                        setEditing({
                          status: false,
                          id: course.id
                        })
                      }}
                    >
                      <Trash size={14} />
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
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voce tem certeza que deseja excluir o Tipo de evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser revertida
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setAlertVisible(false) }}
            >Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
            >
              Sim, tenho certeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer
        open={drawerVisibleForm}
      >
        <DrawerContent className="h-80% ">
          <DrawerHeader>
            <DrawerTitle>Adicione novo tipo de evento</DrawerTitle>
          </DrawerHeader>
          <div className='h-max p-4'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Nome do evento </FormLabel>
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

                <DrawerFooter className="flex flex-row justify-between m-0 p-0">
                  <DrawerClose>
                    <Button variant="outline" onClick={() => { setDrawerVisibleForm(false) }}>Cancelar</Button>
                  </DrawerClose>
                  <Button type="submit" disabled={loading}>
                    {loading ? <LoadingSpinner className="text-dark" /> : "Enviar"}
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
