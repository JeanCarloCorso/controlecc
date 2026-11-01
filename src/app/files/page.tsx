"use client";
import ResponsiveMenu from "@/components/responsive-menu";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "@/lib/api-client";
import { database as db, storage } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { calculatePdfHash } from "@/lib/utils";
import { getStorage, ref, uploadBytes, getDownloadURL } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import withAuthorization from "@/components/with-authorization";
import FilesTable from "@/components/files/FilesTable";
import FileUploadDrawer from "@/components/files/FileUploadDrawer";
import FileViewDrawer from "@/components/files/FileViewDrawer";
import { PageLoader } from "@/components/page-loader";
import { PageHeader } from "@/components/page-header";
import { InlineFeedback } from "@/components/inline-feedback";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome é obrigatório" }),
  description: z.string().min(2, {
    message: "Descrição é obrigatória",
  }),
  file: z.any().refine((files) => files?.length > 0, "Selecione um arquivo PDF."),
  workload: z.string().min(1, { message: "Carga horária é obrigatória" }).refine((value) => Number(value) > 0, "Informe uma carga horária maior que zero."),
  completionDate: z.date({ error: "Data de realização é obrigatória" }),
});

interface FileValidation {
  name: string;
  description: string;
  workload: string;
  hashFile: string;
  pathFile: string;
  completionDate: string;
}

const MAX_PDF_SIZE = 5 * 1024 * 1024;

const FilesPage = () => {
  const [filesList, setFilesList] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [drawerVisibleForm, setDrawerVisibleForm] = useState(false);
  const [drawerVisibleView, setDrawerVisibleView] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<any>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      workload: "",
      completionDate: undefined,
    },
    mode: "onBlur",
  });

  const uploadFile = async (file: File) => {
    const storage = getStorage();
    const storageRef = ref(storage, "");

    try {
      const uploaded = await uploadBytes(storageRef, file);
      return uploaded.ref.path;
    } catch (error) {
      console.error("Erro ao upload arquivo:", error);
      throw error; // rethrow the error to propagate it up the call stack
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!values?.file || !session) {
        toast({
          variant: "destructive",
          title: "Ops! Nenhum arquivo selecionado.",
          description: "Selecione um arquivo ou tente novamente mais tarde.",
        });
        return;
      }

      {
        if (values.file?.length > 0) {
          const selectedFile = values.file[0] as File;

          if (selectedFile.type !== "application/pdf") {
            toast({
              variant: "destructive",
              title: "Arquivo inválido.",
              description: "Selecione um arquivo no formato PDF.",
            });
            return;
          }

          if (selectedFile.size > MAX_PDF_SIZE) {
            toast({
              variant: "destructive",
              title: "PDF muito grande.",
              description: "O arquivo deve ter no máximo 5 MB.",
            });
            return;
          }

          setSubmitting(true);
          const hash = await calculatePdfHash(selectedFile);

          const filesCollectionRef = collection(db, "files");

          const q = query(filesCollectionRef, where("hashFile", "==", hash));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            toast({
              variant: "destructive",
              title: "Este arquivo já foi enviado",
              description:
                "Escolha outro comprovante para evitar atividades duplicadas.",
            });
            setSubmitting(false);
            setDrawerVisibleForm(false);
            form.clearErrors();
            form.reset();
            return;
          } else {
            const pathFile = await uploadFile(selectedFile);

            const fileValidation: FileValidation = {
              name: values.name,
              description: values.description,
              workload: values.workload,
              hashFile: hash,
              pathFile,
              completionDate: values.completionDate
                ? values.completionDate.toISOString().split("T")[0]
                : "",
            };

            await addDoc(collection(db, "files"), fileValidation);

            toast({
              title: "Atividade enviada com sucesso",
              description: "O documento foi recebido e aguarda validação.",
            });

            setSubmitting(false);
            setDrawerVisibleForm(false);
            form.clearErrors();
            form.reset();
          }
        } else {
          toast({
            variant: "destructive",
            title: "Ops! Nenhum arquivo selecionado.",
            description: "Selecione um arquivo ou tente novamente mais tarde.",
          });
        }
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Erro ao registrar.",
        description: message,
      });
      console.error("Erro ao registrar:", error);
      setSubmitting(false);
    }
  }

  useEffect(() => {
    async function getAllFiles() {
      setLoading(true);
      setLoadError(false);
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
          setFilesList([]);

          setLoading(false);
          return;
        }

        const arrayFileslist: Array<any> = [];
        querySnapshot.forEach((doc) => {
          arrayFileslist.push(doc.data());
        });

        setFilesList(arrayFileslist.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

        setLoading(false);
      } catch (error) {
        console.error("Erro ao obter lista de arquivos:", error);
        setLoading(false);
        setLoadError(true);
        toast({ variant: "destructive", title: "Não foi possível carregar as atividades", description: "Atualize a página ou tente novamente mais tarde." });
      }
    }
    getAllFiles();
  }, [session, status, drawerVisibleForm, toast]);

  useEffect(() => {
    if (pdfPath === null || pdfPath === undefined) {
      return;
    }

    setPdfUrl(null);
    setPdfLoading(true);
    const pdfRef = ref(storage, pdfPath);

    getDownloadURL(pdfRef)
      .then((url) => {
        if (url === null || url === undefined) {
          console.error(
            "Erro ao obter a URL do PDF: a URL é nula ou indefinida"
          );
          return;
        }
        setPdfUrl(url);
        setPdfLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao obter a URL do PDF:", error);
        setPdfLoading(false);
        toast({ variant: "destructive", title: "Não foi possível abrir o documento", description: "Tente novamente em instantes." });
      });
  }, [drawerVisibleView, pdfPath, toast]);

  if (status === "loading" || !session) {
    return <PageLoader label="Carregando suas atividades..." />;
  } else {
    return (
      <div>
        <ResponsiveMenu />
        <main id="main-content" className="container py-8 md:py-10">
          <PageHeader
            eyebrow="Atividades complementares"
            title="Minhas atividades"
            description="Envie comprovantes e acompanhe a análise das suas atividades complementares."
            actions={<FileUploadDrawer
              drawerVisibleForm={drawerVisibleForm}
              setDrawerVisibleForm={setDrawerVisibleForm}
              form={form}
              onSubmit={onSubmit}
              loading={submitting}
            />}
          />
          {loadError ? <div className="mb-5"><InlineFeedback variant="error" title="Não foi possível carregar suas atividades" description="Atualize a página ou tente novamente em alguns instantes." /></div> : null}
          <FilesTable
            filesList={filesList}
            loading={loading}
            setDrawerVisibleView={setDrawerVisibleView}
            setPdfPath={setPdfPath}
            setPdfLoading={setPdfLoading}
          />
          <FileViewDrawer
            drawerVisibleView={drawerVisibleView}
            setDrawerVisibleView={setDrawerVisibleView}
            pdfUrl={pdfUrl}
            pdfLoading={pdfLoading}
            setPdfLoading={setPdfLoading}
          />
        </main>
      </div>
    );
  }
};

export default withAuthorization(FilesPage, ["common"]);
