import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { loadResourceLookups } from "@/lib/resource-lookups";
import { ResourceForm } from "../resource-form";

export default async function NewResourcePage() {
  // Default to medical lookups on new resource creation. Form starts as medical;
  // user can switch to healthy living, which surfaces partner/program selectors.
  const medical = await loadResourceLookups("medical");
  const hl = await loadResourceLookups("healthy_living");

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/resources">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to resources
        </Link>
      </Button>
      <PageHeader
        title="New resource"
        description="Create a medical or healthy living resource."
      />
      <ResourceForm
        resourceTypeOptions={[
          ...medical.resourceTypes,
          ...hl.resourceTypes,
        ]}
        insurerOptions={medical.insurers}
        agencyOptions={medical.agencies}
        reasonOptions={medical.reasons}
        partnerTypeOptions={hl.partnerTypes}
        programTypeOptions={hl.programTypes}
      />
    </div>
  );
}
