// pages/dashboard/page.tsx
'use client'
import ResponsiveMenu from '@/components/responsive-menu';
import { useSession } from 'next-auth/react';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import withAuthorization from '@/components/with-authorization';
import Courses from '@/components/courses'
import Projects from '@/components/projects';
import EventTypes from '@/components/event-types';
import { PageLoader } from '@/components/page-loader';

const AdminPanelPage = () => {
  const { data: session, status } = useSession();


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
