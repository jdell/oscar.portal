import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { formatName } from "@/lib/utils";
import type { StaffMember } from "@/lib/types";

async function loadStaff(id: string): Promise<StaffMember | null> {
  try {
    return await api.get<StaffMember>(`/staffmembers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await loadStaff(id);
  if (!staff) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/staff">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to staff
        </Link>
      </Button>
      <PageHeader title={formatName(staff)} description={staff.title ?? undefined} />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span> {staff.email}
          </p>
          <p>
            <span className="text-muted-foreground">Phone:</span>{" "}
            {staff.phone ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Roles:</span>{" "}
            {staff.roles.join(", ") || "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
