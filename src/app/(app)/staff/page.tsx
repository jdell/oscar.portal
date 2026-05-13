import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { StaffMember, User } from "@/lib/types";
import { StaffTable } from "./staff-table";

async function loadStaff(): Promise<StaffMember[]> {
  const [staff, users] = await Promise.all([
    api
      .get<StaffMember[] | { items: StaffMember[] }>("/staff-members")
      .then((r) => (Array.isArray(r) ? r : (r.items ?? [])))
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          console.error("staff fetch failed", error.status, error.body);
        }
        return [] as StaffMember[];
      }),
    api
      .get<User[] | { items: User[] }>("/users")
      .then((r) => (Array.isArray(r) ? r : (r.items ?? [])))
      .catch(() => [] as User[]),
  ]);

  return staff.map((s) => ({
    ...s,
    user: s.user ?? users.find((u) => u.staffMemberId === s.id) ?? null,
  }));
}

export default async function StaffPage() {
  const staff = await loadStaff();
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
      <StaffTable data={staff} />
    </div>
  );
}
