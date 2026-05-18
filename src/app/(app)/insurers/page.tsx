import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api";
import type { Insurer } from "@/lib/types";
import { InsurersTable } from "./insurers-table";

async function loadInsurers(): Promise<Insurer[]> {
  try {
    const result = await api.get<Insurer[] | { items: Insurer[] }>("/insurers");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error("insurers fetch failed", error.status);
    }
    return [];
  }
}

export default async function InsurersPage() {
  const { data: insurers, rateLimited } = await loadInsurers()
    .then((data) => ({ data, rateLimited: false as boolean }))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 429)
        return { data: [] as Insurer[], rateLimited: true };
      throw error;
    });

  return (
    <div>
      <PageHeader
        title="Insurers"
        description="Insurance providers accepted by your organization."
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
      <InsurersTable data={insurers} />
    </div>
  );
}
