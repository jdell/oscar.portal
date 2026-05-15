import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  CheckSquare,
  XSquare,
} from "lucide-react";
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
import type { Agency, Role, StaffMemberDetail } from "@/lib/types";

async function loadStaff(id: string): Promise<StaffMemberDetail | null> {
  try {
    return await api.get<StaffMemberDetail>(`/staff-members/${id}`);
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

function staffName(s: StaffMemberDetail): string {
  return (
    s.name?.trim() ||
    formatName({ firstName: s.firstName, lastName: s.lastName })
  );
}

function staffEmail(s: StaffMemberDetail): string {
  return s.emailAddress ?? s.email;
}

function staffActive(s: StaffMemberDetail): boolean {
  return s.active ?? s.isActive;
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, agencies, roles] = await Promise.all([
    loadStaff(id),
    loadAgencies(),
    loadRoles(),
  ]);
  if (!staff) notFound();

  const active = staffActive(staff);
  const agencyRoles = staff.agencies ?? [];
  const phoneList = staff.phoneNumbers ?? [];
  const agencyMap = new Map(agencies.map((a) => [String(a.id), a.name]));
  const roleMap = new Map(roles.map((r) => [String(r.id), r.name]));

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/staff">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to staff
          </Link>
        </Button>
        <PageHeader
          title={staffName(staff)}
          description={staff.title ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={active ? "default" : "secondary"}>
                {active ? "Active" : "Inactive"}
              </Badge>
              {staff.isSurveyEnabled ? (
                <Badge variant="outline" className="gap-1">
                  <CheckSquare size={12} /> Survey enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <XSquare size={12} /> Survey disabled
                </Badge>
              )}
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
            <Row icon={<Mail size={14} />}>{staffEmail(staff)}</Row>
            {phoneList.length > 0 ? (
              phoneList.map((p, i) => (
                <Row key={i} icon={<Phone size={14} />}>
                  {p.number}
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    {p.type}
                  </span>
                </Row>
              ))
            ) : (
              <Row icon={<Phone size={14} />}>{staff.phone ?? "—"}</Row>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Affiliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<Building2 size={14} />}>
              {agencyRoles.length > 0
                ? `${agencyRoles.length} agenc${agencyRoles.length === 1 ? "y" : "ies"}`
                : (staff.agencyName ?? "—")}
            </Row>
            <Row label="Roles">{(staff.roles ?? []).join(", ") || "—"}</Row>
            <Row label="Joined">{formatDate(staff.createdAt)}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Credentials</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {staff.user ? (
              <div className="space-y-1">
                <Row icon={<ShieldCheck size={14} />}>{staff.user.username}</Row>
                {staff.user.isAdmin && (
                  <Badge variant="outline">Admin</Badge>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No user credentials. Add via Edit.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agencies">
        <TabsList>
          <TabsTrigger value="agencies">
            Agencies ({agencyRoles.length})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions ({staff.permissionsDetail?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="agencies">
          <Card>
            <CardContent className="pt-6">
              {agencyRoles.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Not associated with any agencies.
                </p>
              ) : (
                <ul className="space-y-3">
                  {agencyRoles.map((ar, i) => {
                    const agencyName =
                      agencyMap.get(String(ar.agencyId)) ??
                      ar.agencyName ??
                      String(ar.agencyId);
                    const roleName =
                      roleMap.get(String(ar.roleId)) ?? ar.roleName;
                    return (
                      <li
                        key={`${ar.agencyId}-${i}`}
                        className="flex items-start justify-between gap-3 rounded-md border p-3"
                      >
                        <div className="flex items-start gap-3">
                          <Building2
                            size={16}
                            className="mt-0.5 text-muted-foreground"
                          />
                          <div>
                            <Link
                              href={`/agencies/${ar.agencyId}`}
                              className="text-sm font-medium hover:underline"
                            >
                              {agencyName}
                            </Link>
                          </div>
                        </div>
                        {roleName && (
                          <Badge variant="secondary">{roleName}</Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="permissions">
          <Card>
            <CardContent className="pt-6">
              {(staff.permissionsDetail ?? []).length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No permissions granted.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {staff.permissionsDetail!.map((p) => (
                    <Badge key={p.id} variant="outline" title={p.description}>
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
      <span className="truncate text-foreground">{children}</span>
    </div>
  );
}
