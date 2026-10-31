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
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  } else {
    return (
      <div>
        <ResponsiveMenu></ResponsiveMenu>

        <div className="container mt-5">
          <div className="flex flex-row justify-between items-center p-3 mb-10 border-b">
            <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
              Painel geral
            </h2>
          </div>
          <div className="flex-row sm:flex-col lg:flex-row justify-center h-full lg:space-x-2 sm:space-y-3 xs:space-y-3">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuários registrados
                </CardTitle>
                <User size={18} />
              </CardHeader>
              <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-2xl font-bold">
                  {dashboardData?.qUsers}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/users");
                  }}
                >
                  Ver detalhes
                  <ArrowRight className="ml-5" size={16} />
                </Button>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Arquivos submetidos
                </CardTitle>
                <FilePlus size={18} />
              </CardHeader>
              <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-2xl font-bold">
                  {dashboardData?.qFiles}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/validation");
                  }}
                >
                  Ver detalhes
                  <ArrowRight className="ml-5" size={16} />
                </Button>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-1 pb-2">
                <CardTitle className="text-sm font-medium">
                  Arquivos pendentes
                </CardTitle>
                <FileClock size={18} />
              </CardHeader>
              <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-2xl font-bold">
                  {dashboardData?.qPendingFiles}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/validation?status=pending");
                  }}
                >
                  Ver pendentes
                  <ArrowRight className="ml-5" size={16} />
                </Button>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-1 pb-2">
                <CardTitle className="text-sm font-medium">
                  Arquivos Arquivados
                </CardTitle>
                <Archive size={18} />
              </CardHeader>
              <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-2xl font-bold">
                  {dashboardData.qArchivedFiles}
                </div>
                <Button
                  variant={"ghost"}
                  onClick={() => {
                    router.push("/validation?status=archived");
                  }}
                >
                  Ver arquivados
                  <ArrowRight className="ml-5" size={16} />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
};

export default withAuthorization(DashboardPage, ["admin"]);
