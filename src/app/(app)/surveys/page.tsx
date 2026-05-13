import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { Survey } from "@/lib/types";
import { SurveysTable } from "./surveys-table";

async function loadSurveys(): Promise<Survey[]> {
  try {
    const result = await api.get<Survey[] | { items: Survey[] }>("/surveys");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("surveys fetch failed", error.status);
    }
    return [];
  }
}

export default async function SurveysPage() {
  const surveys = await loadSurveys();
  return (
    <div>
      <PageHeader
        title="Surveys"
        description="Build and manage participant surveys."
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/surveys/new">
              <Plus className="mr-2 h-4 w-4" /> New survey
            </Link>
          </Button>
        }
      />
      <SurveysTable data={surveys} />
    </div>
  );
}
