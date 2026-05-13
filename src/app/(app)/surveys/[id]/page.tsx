import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Survey } from "@/lib/types";
import { SurveyBuilder } from "../survey-builder";

async function loadSurvey(id: string): Promise<Survey | null> {
  try {
    return await api.get<Survey>(`/surveys/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function EditSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await loadSurvey(id);
  if (!survey) notFound();

  return (
    <div className="max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/surveys">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to surveys
        </Link>
      </Button>
      <PageHeader title="Edit survey" description={survey.name} />
      <SurveyBuilder initial={survey} />
    </div>
  );
}
