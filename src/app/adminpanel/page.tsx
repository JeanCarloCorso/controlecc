// pages/dashboard/page.tsx
'use client'
import ResponsiveMenu from '@/components/responsive-menu';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, database as db } from "@/lib/api-client";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from '@/components/ui/loader';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import withAuthorization from '@/components/with-authorization';
import Courses from '@/components/courses'
import Projects from '@/components/projects';
import EventTypes from '@/components/event-types';
import { PageLoader } from '@/components/page-loader';

const AdminPanelPage = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const { data: session, status } = useSession();
  const { toast } = useToast();


  useEffect(() => {
    async function getUserInfo() {
      if (!session) {
        return;
      }

      try {
        const q = query(collection(db, "courses"));
        const e = query(collection(db, "eventTypes"));

        const querySnapshot = await getDocs(q);
        const queryeSnapshot = await getDocs(e);

        if (querySnapshot.empty && queryeSnapshot.empty) {
          return;
        }


        querySnapshot.forEach((doc) => {

          const data = doc.data();

          const arrayCourses: Array<any> = [];
          querySnapshot.forEach((doc) => {
            arrayCourses.push(doc.data());
          });

          const arrayEvents: Array<any> = [];
          querySnapshot.forEach((doc) => {
            arrayEvents.push(doc.data());
          });

          setCourses(arrayCourses);
          setEventTypes(arrayEvents);

        });
      } catch (error) {
        console.error("Erro ao obter lista de arquivos:", error);
      }
    }
    getUserInfo();

  }, [session, status]);


  if (status === 'loading' || !session) {
    return <PageLoader label="Carregando configurações..." />;
  }

  return (
    <div>
      <ResponsiveMenu />
      <main className="container py-8 md:py-10">
        <div className="gov-page-heading">
          <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
            Painel administrativo
          </h2>
          <p>Gerencie cursos, projetos e tipos de evento usados no cadastro de atividades.</p>
        </div>
        <Tabs defaultValue="courses" className="w-full pb-4">
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto">
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="eventType">Tipos de evento</TabsTrigger>
          </TabsList>
          <TabsContent value="courses">
            <Courses />
          </TabsContent>
          <TabsContent value="projects">
            <Projects />
          </TabsContent>
          <TabsContent value="eventType">
            <EventTypes />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
};

export default withAuthorization(AdminPanelPage, ["admin"]);
