"use client";
import React, { useState, useEffect } from "react";
import ResponsiveMenu from "@/components/responsive-menu";
import { useSession } from "next-auth/react";
import {
  collection,
  getDocs,
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
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InlineFeedback } from "@/components/inline-feedback";
import withAuthorization from "@/components/with-authorization";

function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setLoadError(false);
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
        setLoadError(true);
        console.error("Erro ao obter lista de usuários:", error);
      }
    }
    fetchUsers();
  }, []);

  if (status === "loading" || !session || loading) {
    return <PageLoader label="Carregando usuários..." />;
  }
  return (
    <div>
      <ResponsiveMenu />

      <main id="main-content" className="container py-8 md:py-10">
        <PageHeader eyebrow="Administração" title="Estudantes" description="Consulte os estudantes cadastrados e a carga horária aprovada de cada um." />

        {loadError ? <div className="mb-5"><InlineFeedback variant="error" title="Não foi possível carregar os estudantes" description="Atualize a página ou tente novamente em alguns instantes." /></div> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Horas aprovadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="p-0"><EmptyState title="Nenhum estudante encontrado" description="Os estudantes cadastrados aparecerão nesta lista." /></TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.fullname}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === "admin" ? "Administrador" : "Estudante"}
                </TableCell>
                <TableCell>{user.approvedHours}h</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}

export default withAuthorization(UsersPage, ["admin"]);
