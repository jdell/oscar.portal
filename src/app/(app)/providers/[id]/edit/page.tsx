import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type {
  MedicalResourceSummary,
  Provider,
  ProviderParticipationType,
} from "@/lib/types";
import { ProviderForm } from "../../provider-form";

async function loadProvider(id: string): Promise<Provider | null> {
  try {
    return await api.get<Provider>(`/providers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

async function loadParticipationTypes(): Promise<ProviderParticipationType[]> {
  try {
    const result = await api.get<
      ProviderParticipationType[] | { items: ProviderParticipationType[] }
    >("/participation-types");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch {
    return [];
  }
}

async function loadMedicalResources(): Promise<MedicalResourceSummary[]> {
  try {
    const result = await api.get<
      MedicalResourceSummary[] | { items: MedicalResourceSummary[] }
    >("/medical-resources");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch {
    return [];
  }
}

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [provider, participationTypes, medicalResources] = await Promise.all([
    loadProvider(id),
    loadParticipationTypes(),
    loadMedicalResources(),
  ]);
  if (!provider) notFound();

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/providers/${provider.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to provider
        </Link>
      </Button>
      <PageHeader title="Edit provider" description={provider.name} />
      <ProviderForm
        participationTypes={participationTypes}
        medicalResources={medicalResources}
        initial={provider}
      />
    </div>
  );
}
