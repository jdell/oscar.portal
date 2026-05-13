import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Insurer } from "@/lib/types";
import { InsurersTable } from "./insurers-table";

async function loadInsurers(): Promise<Insurer[]> {
  try {
    const result = await api.get<Insurer[] | { items: Insurer[] }>("/insurers");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("insurers fetch failed", error.status);
    }
    return [];
  }
}

export default async function InsurersPage() {
  const insurers = await loadInsurers();
  return (
    <div>
      <PageHeader
        title="Insurers"
        description="Insurance providers accepted by your organization."
      />
      <InsurersTable data={insurers} />
    </div>
  );
}
