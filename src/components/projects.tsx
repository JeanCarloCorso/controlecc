import React, { useCallback, useEffect, useState } from "react";
import { Edit2Icon, Plus, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, database as db, doc, getDocs, query, setDoc } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { InlineFeedback } from "@/components/inline-feedback";

const formSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do projeto"),
  year: z.string().regex(/^\d{4}$/, "Informe o ano com quatro dígitos"),
});

type ProjectForm = z.infer<typeof formSchema>;
type Project = ProjectForm & { uid: string; id?: string; course?: string };
type Course = { id: string; name: string; projects: Project[] };

export default function Projects() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { toast } = useToast();

  const form = useForm<ProjectForm>({ resolver: zodResolver(formSchema), defaultValues: { name: "", year: "" }, mode: "onBlur" });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const snapshot = await getDocs(query(collection(db, "courses")));
      const nextCourses = snapshot.docs.map((item: any) => ({ ...item.data(), id: item.id, projects: item.data().projects || [] })) as Course[];
      setCourses(nextCourses);
      setSelectedCourse((current) => nextCourses.find((course) => course.id === current?.id) || nextCourses[0] || null);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const openCreate = () => {
    setProjectToEdit(null);
    form.reset({ name: "", year: "" });
    setDrawerOpen(true);
  };

  const openEdit = (project: Project) => {
    setProjectToEdit(project);
    form.reset({ name: project.name, year: String(project.year) });
    setDrawerOpen(true);
  };

  async function saveProjects(nextProjects: Project[]) {
    if (!selectedCourse) return;
    await setDoc(doc(db, "courses", selectedCourse.id), { projects: nextProjects }, { merge: true });
  }

  async function onSubmit(values: ProjectForm) {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      const nextProjects = projectToEdit
        ? selectedCourse.projects.map((project) => project.uid === projectToEdit.uid ? { ...project, ...values } : project)
        : [...selectedCourse.projects, { ...values, uid: crypto.randomUUID(), course: selectedCourse.name }];
      await saveProjects(nextProjects);
      toast({ title: projectToEdit ? "Projeto atualizado" : "Projeto adicionado", description: `As alterações em ${selectedCourse.name} foram salvas.` });
      setDrawerOpen(false);
      await loadCourses();
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      toast({ variant: "destructive", title: "Não foi possível salvar o projeto", description: "Revise os dados e tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedCourse || !projectToDelete) return;
    setSaving(true);
    try {
      await saveProjects(selectedCourse.projects.filter((project) => project.uid !== projectToDelete.uid));
      toast({ title: "Projeto excluído", description: "O projeto foi removido do curso selecionado." });
      setProjectToDelete(null);
      await loadCourses();
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast({ variant: "destructive", title: "Não foi possível excluir o projeto", description: "Tente novamente em alguns instantes." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch pt-4">
      {loadError ? <div className="mb-4"><InlineFeedback variant="error" title="Não foi possível carregar os projetos" description="Atualize a página ou tente novamente em alguns instantes." /></div> : null}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full space-y-1.5 sm:w-[280px]">
          <Label id="course-select-label">Curso</Label>
          <Select value={selectedCourse?.id || ""} onValueChange={(value) => setSelectedCourse(courses.find((course) => course.id === value) || null)}>
            <SelectTrigger aria-labelledby="course-select-label"><SelectValue placeholder="Selecione um curso" /></SelectTrigger>
            <SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} disabled={!selectedCourse || loading}><Plus className="mr-2" size={16} aria-hidden="true" /> Adicionar projeto</Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Ano</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={3} className="py-10"><span className="flex items-center justify-center gap-3" aria-live="polite"><LoadingSpinner /> Carregando projetos…</span></TableCell></TableRow>
          ) : !selectedCourse || selectedCourse.projects.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="p-0"><EmptyState title="Nenhum projeto cadastrado" description={selectedCourse ? `Adicione o primeiro projeto de ${selectedCourse.name}.` : "Cadastre um curso antes de adicionar projetos."} /></TableCell></TableRow>
          ) : selectedCourse.projects.map((project) => (
            <TableRow key={project.uid}>
              <TableCell>{project.name}</TableCell><TableCell>{project.year}</TableCell>
              <TableCell><div className="flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(project)}><Edit2Icon className="mr-2" size={16} aria-hidden="true" /> Editar</Button>
                <Button size="sm" variant="ghost" className="text-[#b50909]" onClick={() => setProjectToDelete(project)}><Trash className="mr-2" size={16} aria-hidden="true" /> Excluir</Button>
              </div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={Boolean(projectToDelete)} onOpenChange={(open) => { if (!open) setProjectToDelete(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir projeto?</AlertDialogTitle><AlertDialogDescription>O projeto “{projectToDelete?.name}” será removido de {selectedCourse?.name}. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white hover:bg-[#b50909]" disabled={saving} onClick={onDelete}>{saving ? "Excluindo…" : "Excluir projeto"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent><DrawerHeader><DrawerTitle>{projectToEdit ? "Editar projeto" : "Adicionar projeto"}</DrawerTitle><DrawerDescription>Os campos marcados como obrigatórios devem ser preenchidos.</DrawerDescription></DrawerHeader>
          <div className="overflow-y-auto px-4 pb-5 sm:px-6"><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormItem><FormLabel>Curso</FormLabel><Input value={selectedCourse?.name || ""} disabled /></FormItem>
            <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome do projeto <span className="text-[#b50909]">(obrigatório)</span></FormLabel><FormControl><Input placeholder="Ex.: Projeto de extensão" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="year" render={({ field }) => <FormItem><FormLabel>Ano <span className="text-[#b50909]">(obrigatório)</span></FormLabel><FormControl><Input inputMode="numeric" maxLength={4} placeholder="Ex.: 2026" {...field} /></FormControl><FormMessage /></FormItem>} />
            <DrawerFooter className="m-0 flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end"><DrawerClose asChild><Button type="button" variant="outline">Cancelar</Button></DrawerClose><Button type="submit" disabled={saving}>{saving ? <><LoadingSpinner className="mr-2" /> Salvando…</> : "Salvar projeto"}</Button></DrawerFooter>
          </form></Form></div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
