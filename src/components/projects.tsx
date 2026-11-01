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
import { collection, query, getDocs, doc, setDoc, deleteDoc } from "@/lib/api-client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nome é obrigatório",
  }),
  year: z.string().min(4, {
    message: "Ano é obrigatório",
  }),
  course: z.string().min(2, {
    message: "Nome é obrigatório",
  }),
});

export default function Projects() {
  const [selectedCourse, setSelectedCourse] = useState({
    name: "",
    id: "",
    projects: []
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
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
        const q = query(collection(db, "courses"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return;
        }

        const arrayCourses: Array<any> = [];

        let firstElement: any = querySnapshot.docs[0].data();
        firstElement.id = querySnapshot.docs[0].id;

        if(selectedCourse.name === ""){
          if (firstElement) {
            setSelectedCourse(firstElement);
            setProjects(firstElement.projects)
          }
        }
        querySnapshot.forEach((doc: any) => {
          let course: any = doc.data()



          course.id = doc.id

          arrayCourses.push(course);
        });


        setCourses(arrayCourses);

      } catch (error) {
        console.error("Erro ao obter lista de arquivos:", error);
      }
    }
    getUserInfo();

  }, [drawerVisibleForm, alertVisible, selectedCourse.name]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      year: "",
      course: ""
    },
    mode: "onBlur",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      if(editing.status){
        let lastProjects: any = selectedCourse?.projects;
        let data: any = selectedCourse;
        let currentId = editing.id;
        

        let arrayProjects:any = [];
        lastProjects.map((item:any) => {
          
          let updateItem = item;

          if(item.uid === currentId){
            updateItem.name = values.name;
            updateItem.year = values.year;            
          }

          arrayProjects.push(updateItem)
        })
  

  
        data.projects = arrayProjects;
  
  
        const docRef = doc(db, "courses", selectedCourse.id)
  
        setDoc(docRef, data, {
          merge: true
        }).then(() => {
          toast({
            title: "Projeto atualizado com sucesso!",
          })
  
          setLoading(false);
          setDrawerVisibleForm(false);
          form.clearErrors();
          form.reset();
  
        })
  
        
        setSelectedCourse(data)
        setProjects(lastProjects)
      

      }else{
      let projectData: any = values;
      let lastProjects: any = selectedCourse?.projects;
      let data: any = selectedCourse;

      lastProjects.push(projectData);

      data.projects = lastProjects;

      const docRef = doc(db, "courses", selectedCourse.id)

      await setDoc(docRef, data, {
        merge: true
      })

      toast({
        title: "Projeto adicionado com sucesso!",
      })

      setLoading(false);
      setDrawerVisibleForm(false);
      form.clearErrors();
      form.reset();

      
      setSelectedCourse(data)
      setProjects(lastProjects)
    }

    } catch (e) {
      
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Falha ao cadastrar curso! Tente novamente.",
      })
    }

  }

  async function onDelete() {
    try {
      let docRef = doc(db, 'courses', editing.id);

      await deleteDoc(docRef)
        .then(() => {
          setAlertVisible(false);

          toast({
            title: "Curso deletado com sucesso!",
          });

          setLoading(false)
        })


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

      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:justify-end">
        <Select
          onValueChange={(value) => {
            let selected = courses.filter((val) => val.id === value)[0];
            

            setSelectedCourse(selected)
            setProjects(selected.projects)

          }}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue
              defaultValue={selectedCourse.id}
              placeholder={selectedCourse.name}
            />
          </SelectTrigger>
          <SelectContent>
            {
              courses.map((course) => (
                <SelectItem
                  key={course.id}


                  onSelect={() => {
                    setProjects(course.projects);

                  }}
                  value={course.id}
                >
                  {course.name}
                </SelectItem>
              ))
            }

          </SelectContent>
        </Select>


        <Button
          className="w-full sm:w-auto"
          variant={"default"}
          onClick={(e) => {
            e.preventDefault();

            form.setValue("course", selectedCourse.name)
            setDrawerVisibleForm(true)
          }}
        >
          <Plus size={16} />

          Adicionar projeto
        </Button>

      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Nome</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            projects?.length === 0 ?

              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhum projeto cadastrado para este curso.
                </TableCell>
              </TableRow>
              :
              projects?.map((project: any) => (
                <TableRow key={project.name}>
                  <TableCell>
                    {project.name}
                  </TableCell>

                  <TableCell>
                    {project.year}
                  </TableCell>

                  <TableCell>
                    <div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          form.setValue("course", selectedCourse.name)
                          form.setValue("name", project.name);
                          form.setValue("year", project.year);
                          setEditing({
                            status: true,
                            id: project.uid
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
                            id: project.id
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
            <AlertDialogTitle>Excluir este projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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
              Excluir projeto
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
            <DrawerTitle>{editing.status ? "Editar projeto" : "Adicionar projeto"}</DrawerTitle>
          </DrawerHeader>
          <div className='overflow-y-auto px-4 pb-5 sm:px-6'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Curso </FormLabel>
                      <FormControl>
                        <Input
                          disabled={true}
                          placeholder=""
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
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Nome do projeto </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome do projeto"
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
                  name="year"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Ano do projeto </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o ano do projeto"
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
                    {loading ? <LoadingSpinner /> : editing.status ? "Salvar alterações" : "Adicionar projeto"}
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
