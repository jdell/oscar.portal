import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { AgencyDetail } from "@/lib/types";
import { loadAgencyLookups } from "@/lib/agency-lookups";
import { AgencyForm } from "../../agency-form";

async function loadAgency(id: string): Promise<AgencyDetail | null> {
  try {
    return await api.get<AgencyDetail>(`/agencies/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function EditAgencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [agency, lookups] = await Promise.all([
    loadAgency(id),
    loadAgencyLookups(),
  ]);
  if (!agency) notFound();

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/agencies/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to agency
        </Link>
      </Button>
      <PageHeader
        title={`Edit ${agency.name}`}
        description="Update this agency's details."
      />
      <AgencyForm
        initial={agency}
        staff={lookups.staff}
        states={lookups.filterOptions.states}
        counties={lookups.filterOptions.counties}
        insurers={lookups.filterOptions.insurers}
        healthyLivingResources={lookups.healthyLivingResources}
        medicalResources={lookups.medicalResources}
        permissions={lookups.permissions}
      />
    </div>
  );
}
