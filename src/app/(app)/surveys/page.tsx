import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api";
import type { Survey } from "@/lib/types";
import { SurveysTable } from "./surveys-table";

async function loadSurveys(): Promise<Survey[]> {
  try {
    const result = await api.get<Survey[] | { items: Survey[] }>("/surveys");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error("surveys fetch failed", error.status);
    }
    return [];
  }
}

export default async function SurveysPage() {
  const { data: surveys, rateLimited } = await loadSurveys()
    .then((data) => ({ data, rateLimited: false as boolean }))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 429)
        return { data: [] as Survey[], rateLimited: true };
      throw error;
    });

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
      {rateLimited && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Too many requests</AlertTitle>
          <AlertDescription>
            The server is rate-limiting requests. Please wait a moment and
            refresh the page.
          </AlertDescription>
        </Alert>
      )}
      <SurveysTable data={surveys} />
    </div>
  );
}
