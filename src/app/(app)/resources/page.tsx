import Link from "next/link";
import {
  AlertCircle,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Plus,
  Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KpiCard } from "@/components/kpi-card";
import { api, ApiError } from "@/lib/api";
import type {
  Agency,
  HealthyLivingResourceType,
  MedicalResourceType,
  PartnerType,
  ProgramType,
  Resource,
} from "@/lib/types";
import { ResourcesTable } from "./resources-table";

async function safeList<T>(path: string): Promise<T[]> {
  try {
    const result = await api.get<T[] | { items: T[] }>(path);
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error(`${path} fetch failed`, error.status);
    }
    return [];
  }
}

async function loadPhoneNumberTypes(): Promise<Map<number, string>> {
  try {
    const items = await api.get<{ id: number; name: string }[]>(
      "/phone-number-types",
    );
    return new Map(items.map((t) => [t.id, t.name]));
  } catch {
    return new Map();
  }
}

export default async function ResourcesPage() {
  const {
    medical,
    healthy,
    medicalTypes,
    hlTypes,
    agencies,
    partnerTypes,
    programTypes,
    phoneTypes,
    rateLimited,
  } = await Promise.all([
    safeList<Resource>("/medical-resources"),
    safeList<Resource>("/healthy-living-resources"),
    safeList<MedicalResourceType>("/medical-resource-types"),
    safeList<HealthyLivingResourceType>("/healthy-living-resource-types"),
    safeList<Agency>("/agencies"),
    safeList<PartnerType>("/partner-types"),
    safeList<ProgramType>("/program-types"),
    loadPhoneNumberTypes(),
  ])
    .then(([medical, healthy, medicalTypes, hlTypes, agencies, partnerTypes, programTypes, phoneTypes]) => ({
      medical,
      healthy,
      medicalTypes,
      hlTypes,
      agencies,
      partnerTypes,
      programTypes,
      phoneTypes,
      rateLimited: false as boolean,
    }))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 429)
        return {
          medical: [] as Resource[],
          healthy: [] as Resource[],
          medicalTypes: [] as MedicalResourceType[],
          hlTypes: [] as HealthyLivingResourceType[],
          agencies: [] as Agency[],
          partnerTypes: [] as PartnerType[],
          programTypes: [] as ProgramType[],
          phoneTypes: new Map<number, string>(),
          rateLimited: true,
        };
      throw error;
    });

  const resources: Resource[] = [
    ...medical.map((r) => ({ ...r, category: "medical" as const })),
    ...healthy.map((r) => ({ ...r, category: "healthy_living" as const })),
  ];

  const total = resources.length;
  const active = resources.filter((r) => r.active ?? r.isActive).length;
  const inactive = total - active;
  const medicalCount = medical.length;

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Medical and healthy living resources available to your organization."
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/resources/new">
              <Plus className="mr-2 h-4 w-4" /> New resource
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

      <section
        aria-label="Resource stats"
        className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          title="Total resources"
          value={total}
          icon={<HeartPulse size={16} />}
          accent="#0EA5E9"
        />
        <KpiCard
          title="Active"
          value={active}
          icon={<CheckCircle2 size={16} />}
          accent="#16A34A"
          secondaryLabel="Total"
          secondaryValue={total}
        />
        <KpiCard
          title="Inactive"
          value={inactive}
          icon={<XCircle size={16} />}
          accent="#94A3B8"
        />
        <KpiCard
          title="Medical"
          value={medicalCount}
          icon={<Stethoscope size={16} />}
          accent="#8E24AA"
          secondaryLabel="Healthy living"
          secondaryValue={healthy.length}
        />
      </section>

      <ResourcesTable
        data={resources}
        medicalTypes={medicalTypes}
        hlTypes={hlTypes}
        agencies={agencies}
        partnerTypes={partnerTypes}
        programTypes={programTypes}
        phoneTypes={phoneTypes}
      />
    </div>
  );
}
