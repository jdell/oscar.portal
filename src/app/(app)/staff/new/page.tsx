import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Agency, Role, StaffMember } from "@/lib/types";
import { StaffForm } from "../staff-form";
import { formatName } from "@/lib/utils";

async function loadAgencies(): Promise<Agency[]> {
  try {
    const r = await api.get<Agency[] | { items: Agency[] }>("/agencies");
    return Array.isArray(r) ? r : (r.items ?? []);
  } catch (e) {
    if (e instanceof ApiError) console.error("agencies fetch failed", e.status);
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

export default async function NewStaffPage() {
  const [agencies, roles, staffMembers] = await Promise.all([
    loadAgencies(),
    loadRoles(),
    loadStaffMembers(),
  ]);
  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/staff">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to staff
        </Link>
      </Button>
      <PageHeader
        title="New staff member"
        description="Add a new staff member to your organization."
      />
      <StaffForm agencies={agencies} roles={roles} staffMembers={staffMembers} />
    </div>
  );
}
