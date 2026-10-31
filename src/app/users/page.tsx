"use client";
import React, { useState, useEffect } from "react";
import ResponsiveMenu from "@/components/responsive-menu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
} from "@/lib/api-client";
import { database as db } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingSpinner } from "@/components/ui/loader";
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
import { PageLoader } from "@/components/page-loader";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  role: z.string().min(2, { message: "Papel é obrigatório" }),
});

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [editing, setEditing] = useState({ status: false, id: "" });
  const [drawerVisibleForm, setDrawerVisibleForm] = useState(false);
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersArray: any[] = usersSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          files: [],
          approvedHours: 0,
        }));

        const filesSnapshot = await getDocs(collection(db, "files"));
        const filesArray = filesSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const filesByUserId: any = {};
        for (const file of filesArray) {
          const typedFile = file as any;
          if (!filesByUserId[typedFile.userId])
            filesByUserId[typedFile.userId] = [];
          filesByUserId[typedFile.userId].push(typedFile);
        }

        for (const user of usersArray) {
          const userFiles = filesByUserId[user.id] || [];
          user.files = userFiles;
          user.approvedHours = userFiles
            .filter((file: any) => file.status === "approved")
            .reduce(
              (sum: number, file: any) => sum + (parseInt(file.workload) || 0),
              0
            );
        }

        setUsers(usersArray.filter((user) => user.role !== "admin"));
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Erro ao obter lista de usuários:", error);
      }
    }
    fetchUsers();
  }, [drawerVisibleForm, alertVisible]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", role: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      if (editing.status) {
        const docRef = doc(db, "users", editing.id);
        await setDoc(docRef, { ...values }, { merge: true });
        toast({ title: "Usuário atualizado com sucesso!" });
      } else {
        const data = { ...values, createdAt: serverTimestamp() };
        await addDoc(collection(db, "users"), data);
        toast({ title: "Usuário cadastrado com sucesso!" });
      }
      setLoading(false);
      setDrawerVisibleForm(false);
      form.clearErrors();
      form.reset();
    } catch (e) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Falha ao cadastrar usuário! Tente novamente.",
      });
    }
  }

  async function onDelete() {
    try {
      let docRef = doc(db, "users", editing.id);
      await deleteDoc(docRef);
      setAlertVisible(false);
      toast({ title: "Usuário deletado com sucesso!" });
      setLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao excluir usuário! Tente novamente",
      });
      setAlertVisible(false);
    }
  }

  if (status === "loading" || !session || loading) {
    return <PageLoader label="Carregando usuários..." />;
  }
  if (session.user.role !== "admin") {
    router.push("/unauthorized");
    return null;
  }

  return (
    <div>
      <ResponsiveMenu />

      <main className="container py-8 md:py-10">
        <div className="gov-page-heading">
          <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
            Usuários
          </h2>
          <p>Consulte estudantes cadastrados e a carga horária aprovada.</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Horas Aprovadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-[#555555]">Nenhum usuário encontrado.</TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.fullname}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === "admin" ? "Administrador" : "Usuário"}
                </TableCell>
                <TableCell>{user.approvedHours}h</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
      <AlertDialog open={alertVisible} onOpenChange={setAlertVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
