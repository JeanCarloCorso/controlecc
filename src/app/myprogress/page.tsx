// pages/dashboard/page.tsx
"use client";
import ResponsiveMenu from "@/components/responsive-menu";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, database as db } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import withAuthorization from "@/components/with-authorization";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { InlineFeedback } from "@/components/inline-feedback";

const ProgressPage = () => {
  const [myWorkload, setMyWorkload] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    async function getUserInfo() {
      if (!session) {
        return;
      }

      try {
        setLoadError(false);
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
        setLoadError(true);
      }
    }
    getUserInfo();
  }, [session, status]);

  if (status === "loading" || !session) {
    return <PageLoader label="Calculando suas horas aprovadas..." />;
  }

  return (
    <div>
      <ResponsiveMenu />
      <main id="main-content" className="container py-8 md:py-10">
        <PageHeader eyebrow="Atividades complementares" title="Meu progresso" description="Consulte a carga horária aprovada nas suas atividades complementares." />
        {loadError ? <div className="mb-5"><InlineFeedback variant="error" title="Não foi possível calcular seu progresso" description="Atualize a página ou tente novamente em alguns instantes." /></div> : null}
        <Card className="max-w-3xl overflow-hidden border-t-4 border-t-[#168821]">
          <CardHeader>
            <CardTitle>Horas aprovadas</CardTitle>
            <CardDescription>Total reconhecido pela coordenação nas atividades analisadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 rounded-sm bg-[#e3f5e1] p-5 sm:flex-row sm:items-end sm:justify-between">
              <div><span className="text-5xl font-light text-[#0b4b3f]">{myWorkload}</span><span className="ml-2 text-xl font-semibold text-[#0b4b3f]">horas</span></div>
              <p className="max-w-sm text-sm text-[#333333]">Somente atividades com status <strong>Aprovado</strong> entram neste total.</p>
            </div>
            <p className="mt-5 text-sm text-[#555555]">Consulte a página de atividades para acompanhar documentos pendentes ou rejeitados.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default withAuthorization(ProgressPage, ["common"]);
