// pages/dashboard/page.tsx
"use client";
import ResponsiveMenu from "@/components/responsive-menu";
import { LoadingSpinner } from "@/components/ui/loader";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import withAuthorization from "@/components/with-authorization";
import { collection, query, getDocs, where, database as db } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FileClock, FilePlus, User, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/page-loader";

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

  useEffect(() => {
    const getData = async () => {
      if (!session) return;

      try {
        // Fetch all data in parallel with optimized queries
        const [filesSnapshot, usersSnapshot, pendingFilesSnapshot] =
          await Promise.all([
            getDocs(collection(db, "files")),
            getDocs(collection(db, "users")),
            getDocs(
              query(collection(db, "files"), where("status", "==", "pending"))
            ),
          ]);

        // Count users without role (filter in JS since Firestore can't query missing fields)
        const usersWithoutRole = usersSnapshot.docs.filter(
          (doc) => !doc.data().role
        ).length;

        // Count all files that are not archived
        const allFilesNotArchived = filesSnapshot.docs.filter(
          (doc) => !doc.data().archived
        ).length;

        // Count pending files that are not archived
        const pendingNotArchived = pendingFilesSnapshot.docs.filter(
          (doc) => !doc.data().archived
        ).length;

        setDashboardData({
          qFiles: allFilesNotArchived,
          qUsers: usersWithoutRole,
          qPendingFiles: pendingNotArchived,
          qArchivedFiles: filesSnapshot.docs.filter(
            (doc) => doc.data().archived
          ).length,
        });
      } catch (error) {
        console.error("Erro ao obter dados do dashboard:", error);
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

        <main className="container py-8 md:py-10">
          <div className="gov-page-heading">
            <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
              Painel geral
            </h2>
            <p>Visão geral das atividades complementares e dos usuários do sistema.</p>
          </div>
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
                  {dashboardData?.qUsers}
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
                  Arquivos submetidos
                </CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5ff] text-[#1351b4]"><FilePlus size={20} /></span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div className="text-4xl font-light text-[#071d41]">
                  {dashboardData?.qFiles}
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
                  Arquivos pendentes
                </CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff5c2] text-[#6f4e00]"><FileClock size={20} /></span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div className="text-4xl font-light text-[#071d41]">
                  {dashboardData?.qPendingFiles}
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
                  Arquivos Arquivados
                </CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6e6e6] text-[#555555]"><Archive size={20} /></span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div className="text-4xl font-light text-[#071d41]">
                  {dashboardData.qArchivedFiles}
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
