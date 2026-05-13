import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import { formatName } from "@/lib/utils";
import type { Agency, Role, StaffMember } from "@/lib/types";
import { StaffForm } from "../../staff-form";

async function loadStaff(id: string): Promise<StaffMember | null> {
  try {
    return await api.get<StaffMember>(`/staff-members/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

async function loadAgencies(): Promise<Agency[]> {
  try {
    const r = await api.get<Agency[] | { items: Agency[] }>("/agencies");
    return Array.isArray(r) ? r : (r.items ?? []);
  } catch {
    return [];
  }
}

async function loadRoles(): Promise<Role[]> {
  try {
    const r = await api.get<Role[] | { items: Role[] }>("/roles");
    return Array.isArray(r) ? r : (r.items ?? []);
  } catch {
    return [];
  }
}

async function loadStaffMembers(): Promise<{ id: string; name: string }[]> {
  try {
    const r = await api.get<StaffMember[] | { items: StaffMember[] }>(
      "/staff-members",
    );
    const list = Array.isArray(r) ? r : (r.items ?? []);
    return list.map((s) => ({
      id: s.id,
      name: s.name?.trim() || formatName(s),
    }));
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
  const [staff, agencies, roles, staffMembers] = await Promise.all([
    loadStaff(id),
    loadAgencies(),
    loadRoles(),
    loadStaffMembers(),
  ]);
  if (!staff) notFound();

  const displayName =
    staff.name?.trim() ||
    formatName({ firstName: staff.firstName, lastName: staff.lastName });

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/staff/${staff.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to staff member
        </Link>
      </Button>
      <PageHeader title="Edit staff member" description={displayName} />
      <StaffForm
        agencies={agencies}
        roles={roles}
        staffMembers={staffMembers}
        initial={staff}
      />
    </div>
  );
}
