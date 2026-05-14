import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { loadAgencyLookups } from "@/lib/agency-lookups";
import { AgencyForm } from "../agency-form";

export default async function NewAgencyPage() {
  const lookups = await loadAgencyLookups();

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/agencies">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to agencies
        </Link>
      </Button>
      <PageHeader
        title="New agency"
        description="Create a new agency under your organization."
      />
      <AgencyForm
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
