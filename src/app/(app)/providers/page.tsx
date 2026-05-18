import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api";
import type {
  MedicalResourceSummary,
  Provider,
  ProviderParticipationType,
} from "@/lib/types";
import { ProvidersTable } from "./providers-table";

async function loadProviders(): Promise<Provider[]> {
  try {
    const [providers, participationTypes, medicalResources] = await Promise.all(
      [
        api.get<Provider[] | { items: Provider[] }>("/providers"),
        api.get<
          ProviderParticipationType[] | { items: ProviderParticipationType[] }
        >("/participation-types"),
        api.get<MedicalResourceSummary[] | { items: MedicalResourceSummary[] }>(
          "/medical-resources",
        ),
      ],
    );
    const providersList: Provider[] = Array.isArray(providers)
      ? providers
      : (providers.items ?? []);
    const ptList: ProviderParticipationType[] = Array.isArray(participationTypes)
      ? participationTypes
      : (participationTypes.items ?? []);
    const mrList: MedicalResourceSummary[] = Array.isArray(medicalResources)
      ? medicalResources
      : (medicalResources.items ?? []);
    return providersList.map((p) => ({
      ...p,
      participationType:
        p.participationType ??
        ptList.find((t) => t.id === p.providerParticipationTypeId) ??
        null,
      medicalResource:
        p.medicalResource ??
        mrList.find((m) => m.id === p.medicalResourceId) ??
        null,
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error("providers fetch failed", error.status);
    }
    return [];
  }
}

export default async function ProvidersPage() {
  const { data: providers, rateLimited } = await loadProviders()
    .then((data) => ({ data, rateLimited: false as boolean }))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 429)
        return { data: [] as Provider[], rateLimited: true };
      throw error;
    });

  return (
    <div>
      <PageHeader
        title="Providers"
        description="Healthcare providers associated with your organization."
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/providers/new">
              <Plus className="mr-2 h-4 w-4" /> New provider
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
      <ProvidersTable data={providers} />
    </div>
  );
}
