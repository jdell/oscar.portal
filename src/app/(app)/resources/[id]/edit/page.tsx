import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Resource } from "@/lib/types";
import { loadResourceLookups } from "@/lib/resource-lookups";
import { ResourceForm } from "../../resource-form";

async function loadResource(id: string): Promise<Resource | null> {
  const endpoints = [
    `/medical-resources/${id}`,
    `/healthy-living-resources/${id}`,
  ];
  for (const path of endpoints) {
    try {
      return await api.get<Resource>(path);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) continue;
      if (error instanceof ApiError) continue;
      throw error;
    }
  }
  return null;
}

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await loadResource(id);
  if (!resource) notFound();

  const lookups = await loadResourceLookups(resource.category);

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/resources/${resource.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to resource
        </Link>
      </Button>
      <PageHeader title="Edit resource" description={resource.name} />
      <ResourceForm
        initial={resource}
        resourceTypeOptions={lookups.resourceTypes}
        insurerOptions={lookups.insurers}
        agencyOptions={lookups.agencies}
        reasonOptions={lookups.reasons}
        partnerTypeOptions={lookups.partnerTypes}
        programTypeOptions={lookups.programTypes}
      />
    </div>
  );
}
