import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api";
import type { StaffMember, User } from "@/lib/types";
import { StaffTable } from "./staff-table";

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

async function loadStaff(): Promise<StaffMember[]> {
  const [staff, users] = await Promise.all([
    api
      .get<StaffMember[] | { items: StaffMember[] }>("/staff-members")
      .then((r) => (Array.isArray(r) ? r : (r.items ?? [])))
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          if (error.status === 429) throw error;
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
  const [{ data: staff, rateLimited }, phoneTypes] = await Promise.all([
    loadStaff()
      .then((data) => ({ data, rateLimited: false as boolean }))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 429)
          return { data: [] as StaffMember[], rateLimited: true };
        throw error;
      }),
    loadPhoneNumberTypes(),
  ]);

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
      <StaffTable data={staff} phoneTypes={phoneTypes} />
    </div>
  );
}
