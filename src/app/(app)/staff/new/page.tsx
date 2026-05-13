import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Agency } from "@/lib/types";
import { StaffForm } from "../staff-form";

async function loadAgencies(): Promise<Agency[]> {
  try {
    const result = await api.get<Agency[] | { items: Agency[] }>("/agencies");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("agencies fetch failed", error.status);
    }
    return [];
  }
}

export default async function NewStaffPage() {
  const agencies = await loadAgencies();
  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/staff">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to staff
        </Link>
      </Button>
      <PageHeader
        title="New staff member"
        description="Add a new staff member to your organization."
      />
      <StaffForm agencies={agencies} />
    </div>
  );
}
