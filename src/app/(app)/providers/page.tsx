import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
      console.error("providers fetch failed", error.status);
    }
    return [];
  }
}

export default async function ProvidersPage() {
  const providers = await loadProviders();
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
      <ProvidersTable data={providers} />
    </div>
  );
}
