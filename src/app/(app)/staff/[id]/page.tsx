import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatName } from "@/lib/utils";
import type { StaffMemberDetail } from "@/lib/types";

async function loadStaff(id: string): Promise<StaffMemberDetail | null> {
  try {
    return await api.get<StaffMemberDetail>(`/staff-members/${id}`);
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
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/staff">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to staff
          </Link>
        </Button>
        <PageHeader
          title={formatName(staff)}
          description={staff.title ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={staff.isActive ? "default" : "secondary"}>
                {staff.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/staff/${staff.id}/edit`}>Edit</Link>
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<Mail size={14} />}>{staff.email}</Row>
            <Row icon={<Phone size={14} />}>{staff.phone ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Affiliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<Building2 size={14} />}>
              {staff.agencyName ?? "—"}
            </Row>
            <Row label="Roles">{staff.roles.join(", ") || "—"}</Row>
            <Row label="Joined">{formatDate(staff.createdAt)}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Permissions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">
              {staff.permissions?.length ?? 0} permission
              {(staff.permissions?.length ?? 0) === 1 ? "" : "s"} granted via
              roles.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agencies">
        <TabsList>
          <TabsTrigger value="agencies">
            Agencies ({staff.agencies?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions ({staff.permissions?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="agencies">
          <Card>
            <CardContent className="pt-6">
              {(staff.agencies ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Not associated with any agencies.
                </p>
              ) : (
                <ul className="space-y-3">
                  {staff.agencies.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="flex items-start gap-3">
                        <Building2
                          size={16}
                          className="text-muted-foreground mt-0.5"
                        />
                        <div>
                          <Link
                            href={`/agencies/${a.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {a.name}
                          </Link>
                          {a.primaryLocation && (
                            <p className="text-xs text-muted-foreground">
                              {a.primaryLocation}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {a.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="permissions">
          <Card>
            <CardContent className="pt-6">
              {(staff.permissions ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No permissions granted.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {staff.permissions.map((p) => (
                    <Badge
                      key={p.id}
                      variant="outline"
                      title={p.description}
                    >
                      {p.key}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-foreground truncate">{children}</span>
    </div>
  );
}
