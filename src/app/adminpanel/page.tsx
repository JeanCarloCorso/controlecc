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
    return <div className="flex justify-center items-center h-screen">
      <LoadingSpinner className="bg-dark" /></div>; // Mostra um carregando enquanto a sessão é verificada
  }

  return (
    <div>
      <ResponsiveMenu />
      <div className="container mt-5">
        <div className="flex flex-row justify-between items-center p-3 mb-10 border-b">
          <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
            Painel administrativo
          </h2>
        </div>
        <Tabs defaultValue="courses" className="w-full pb-4">
          <TabsList>
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

      </div>
    </div>
  );
};

export default withAuthorization(AdminPanelPage, ["admin"]);
