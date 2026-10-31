// pages/dashboard/page.tsx
"use client";
import ResponsiveMenu from "@/components/responsive-menu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, database as db } from "@/lib/api-client";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loader";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import withAuthorization from "@/components/with-authorization";

const ProgressPage = () => {
  const [myWorkload, setMyWorkload] = useState(0);
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    async function getUserInfo() {
      if (!session) {
        return;
      }

      try {
        const q = query(
          collection(db, "files"),
          where("userId", "==", session.user.id)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return;
        }

        let workloadCompleted = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          if (data?.status === "approved") {
            workloadCompleted += parseInt(data?.workload);
          }
        });

        setMyWorkload(workloadCompleted);
      } catch (error) {
        console.error("Erro ao obter lista de arquivos:", error);
      }
    }
    getUserInfo();
  }, [session, status]);

  if (status === "loading" || !session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner className="bg-dark" />
      </div>
    );
  }

  return (
    <div>
      <ResponsiveMenu />
      <div className="container mt-5">
        <div className="flex flex-row justify-between items-center p-3 mb-10 border-b">
          <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
            Meu progresso
          </h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
            <CardDescription>Acompanhe seu progresso atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm font-semibold mb-2">
                Carga horária concluída: {myWorkload}h
              </p>
            </div>
            <Progress value={myWorkload} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuthorization(ProgressPage, ["common"]);
