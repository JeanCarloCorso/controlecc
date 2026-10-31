import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Button } from "./ui/button";
import { Edit2Icon, Plus, Trash } from "lucide-react";
import { LoadingSpinner } from "./ui/loader";
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
} from "@/lib/api-client";
import { database as db } from "@/lib/api-client";
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
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nome é obrigatório",
  }),
});

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [editing, setEditing] = useState({
    status: false,
    id: "",
  });
  const [drawerVisibleForm, setDrawerVisibleForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function getUserInfo() {
      try {
        const q = query(collection(db, "courses"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return;
        }

        querySnapshot.forEach((doc) => {
          const arrayCourses: Array<any> = [];

          querySnapshot.forEach((doc) => {
            let course: any = doc.data();
            course.id = doc.id;
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
      name: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      if (editing.status) {
        const docRef = doc(db, "courses", editing.id);

        setDoc(
          docRef,
          {
            name: values.name,
          },
          {
            merge: true,
          }
        ).then(() => {
          toast({
            title: "Curso atualizado com sucesso!",
          });

          setLoading(false);
          setDrawerVisibleForm(false);
          form.clearErrors();
          form.reset();
        });
      } else {
        let data: any = values;

        data.projects = [];
        data.createdAt = serverTimestamp();

        const docRef = await addDoc(collection(db, "courses"), data);

        toast({
          title: "Curso cadastrado com sucesso!",
        });

        setLoading(false);
        setDrawerVisibleForm(false);
        form.clearErrors();
        form.reset();
      }
    } catch (e) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Falha ao cadastrar curso! Tente novamente.",
      });
    }
  }

  async function onDelete() {
    try {
      let docRef = doc(db, "courses", editing.id);

      await deleteDoc(docRef).then(() => {
        setAlertVisible(false);
        toast({
          title: "Curso deletado com sucesso!",
        });
        setLoading(false);
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao excluir curso! Tente novamente",
      });

      setAlertVisible(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch pt-4">
      <div className="flex justify-end pb-3">
        <Button
          variant={"default"}
          onClick={() => {
            setDrawerVisibleForm(true);
          }}
        >
          <Plus size={16} />
          Adicionar curso
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Nome</TableHead>
            <TableHead>Projetos</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses?.length === 0 ? <TableRow><TableCell colSpan={3} className="py-10 text-center text-[#555555]">Nenhum curso cadastrado.</TableCell></TableRow> : courses?.map((course: any) => (
            <TableRow key={course.name}>
              <TableCell>{course.name}</TableCell>
              <TableCell>
                {course?.projects?.length === 0
                  ? "Sem projetos"
                  : course?.projects?.map((obj: any) => obj.name).join(", ")}
              </TableCell>
              <TableCell>
                <div>
                  <Button
                    aria-label={`Editar curso ${course.name}`}
                    variant="ghost"
                    onClick={() => {
                      form.setValue("name", course.name);
                      setEditing({
                        status: true,
                        id: course.id,
                      });
                      setDrawerVisibleForm(true);
                    }}
                  >
                    <Edit2Icon size={14} />
                  </Button>

                  <Button
                    aria-label={`Excluir curso ${course.name}`}
                    variant="ghost"
                    onClick={() => {
                      setAlertVisible(true);
                      setEditing({
                        status: false,
                        id: course.id,
                      });
                    }}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={alertVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir este curso?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Confirme apenas se o curso não for mais utilizado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAlertVisible(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
            >
              Excluir curso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={drawerVisibleForm} onOpenChange={setDrawerVisibleForm}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editing.status ? "Editar curso" : "Adicionar curso"}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-5 sm:px-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Nome do curso </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome do curso"
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
                    <Button
                      type="button"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </DrawerClose>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <LoadingSpinner className="text-dark" />
                    ) : (
                      editing.status ? "Salvar alterações" : "Adicionar curso"
                    )}
                  </Button>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
