import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Agency, StaffDetail } from "@/lib/types";
import { StaffForm } from "../../staff-form";

async function loadStaff(id: string): Promise<StaffDetail | null> {
  try {
    return await api.get<StaffDetail>(`/staff-members/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
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

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, agencies] = await Promise.all([loadStaff(id), loadAgencies()]);
  if (!staff) notFound();

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/staff/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to staff member
        </Link>
      </Button>
      <PageHeader
        title="Edit staff member"
        description="Update staff member details."
      />
      <StaffForm agencies={agencies} initial={staff} />
    </div>
  );
}
