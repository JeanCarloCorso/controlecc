// pages/dashboard/page.tsx
"use client";
import ResponsiveMenu from "@/components/responsive-menu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import withAuthorization from "@/components/with-authorization";
import { collection, getDocs, database as db } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FileClock, FilePlus, User, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { InlineFeedback } from "@/components/inline-feedback";

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<{
    qFiles: number;
    qUsers: number;
    qPendingFiles: number;
    qArchivedFiles: number;
  }>({
    qFiles: 0,
    qUsers: 0,
    qPendingFiles: 0,
    qArchivedFiles: 0,
  });
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const getData = async () => {
      if (!session) return;

      try {
        setDataLoading(true);
        setLoadError(false);
        const [filesSnapshot, usersSnapshot] = await Promise.all([
          getDocs(collection(db, "files")),
          getDocs(collection(db, "users")),
        ]);

        const files = filesSnapshot.docs.map((document) => document.data());
        const users = usersSnapshot.docs.map((document) => document.data());
        const activeFiles = files.filter((file) => file.archived !== true);

        setDashboardData({
          // A página de usuários lista estudantes; administradores não entram no total.
          qUsers: users.filter((user) => user.role !== "admin").length,
          // O total principal acompanha a listagem padrão, que não exibe arquivados.
          qFiles: activeFiles.length,
          qPendingFiles: activeFiles.filter((file) => file.status === "pending").length,
          qArchivedFiles: files.filter((file) => file.archived === true).length,
        });
      } catch (error) {
        console.error("Erro ao obter dados do dashboard:", error);
        setLoadError(true);
      } finally {
        setDataLoading(false);
      }
    };

    getData();
  }, [session]);

  if (status === "loading" || !session) {
    return <PageLoader label="Preparando o painel..." />;
  } else {
    return (
      <div>
        <ResponsiveMenu></ResponsiveMenu>

        <main id="main-content" className="container py-8 md:py-10">
          <PageHeader
            eyebrow="Administração"
            title="Visão geral"
            description="Acompanhe as atividades complementares e os estudantes cadastrados no sistema."
          />
          {loadError ? (
            <div className="mb-5"><InlineFeedback variant="error" title="Não foi possível carregar os indicadores" description="Atualize a página ou tente novamente em alguns instantes." /></div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuários registrados
                </CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5ff] text-[#1351b4]"><User size={20} /></span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div className="text-4xl font-light text-[#071d41]">
                  {dataLoading ? <span className="text-lg" aria-live="polite">Carregando…</span> : dashboardData.qUsers}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/users");
                  }}
                >
                  Ver detalhes
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Atividades enviadas
                </CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5ff] text-[#1351b4]"><FilePlus size={20} /></span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div className="text-4xl font-light text-[#071d41]">
                  {dataLoading ? <span className="text-lg" aria-live="polite">Carregando…</span> : dashboardData.qFiles}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/validation");
                  }}
                >
                  Ver detalhes
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-1 pb-2">
                <CardTitle className="text-sm font-medium">
                  Atividades pendentes
                </CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff5c2] text-[#6f4e00]"><FileClock size={20} /></span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div className="text-4xl font-light text-[#071d41]">
                  {dataLoading ? <span className="text-lg" aria-live="polite">Carregando…</span> : dashboardData.qPendingFiles}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/validation?status=pending");
                  }}
                >
                  Ver pendentes
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-1 pb-2">
                <CardTitle className="text-sm font-medium">
                  Atividades arquivadas
                </CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6e6e6] text-[#555555]"><Archive size={20} /></span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div className="text-4xl font-light text-[#071d41]">
                  {dataLoading ? <span className="text-lg" aria-live="polite">Carregando…</span> : dashboardData.qArchivedFiles}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/validation?status=archived");
                  }}
                >
                  Ver arquivados
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
};

export default withAuthorization(DashboardPage, ["admin"]);
