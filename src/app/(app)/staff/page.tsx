import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { Agency, StaffMember } from "@/lib/types";
import { StaffTable } from "./staff-table";

async function loadStaff(): Promise<StaffMember[]> {
  try {
    const result = await api.get<StaffMember[] | { items: StaffMember[] }>(
      "/staff-members",
    );
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("staff fetch failed", error.status, error.body);
    }
    return [];
  }
}

async function loadAgencies(): Promise<Agency[]> {
  try {
    const result = await api.get<Agency[] | { items: Agency[] }>("/agencies");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch {
    return [];
  }
}

export default async function StaffPage() {
  const [staff, agencies] = await Promise.all([loadStaff(), loadAgencies()]);
  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage staff members across your organization."
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/staff/new">
              <Plus className="mr-2 h-4 w-4" /> New staff
            </Link>
          </Button>
        }
      />
      <StaffTable data={staff} agencies={agencies} />
    </div>
  );
}
