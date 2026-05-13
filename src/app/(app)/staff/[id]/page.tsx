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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatName } from "@/lib/utils";
import type { StaffDetail } from "@/lib/types";

async function loadStaff(id: string): Promise<StaffDetail | null> {
  try {
    return await api.get<StaffDetail>(`/staff-members/${id}`);
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
            <Row icon={<Building2 size={14} />}>
              {staff.agencyName ?? "Unassigned"}
            </Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Roles">
              <span className="capitalize">
                {staff.roles?.join(", ") || "—"}
              </span>
            </Row>
            <Row label="Created">{formatDate(staff.createdAt)}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {staff.isActive
              ? "This staff member is currently active and can sign in."
              : "This staff member is inactive."}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(staff.agencies ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="h-20 text-center text-muted-foreground"
                      >
                        Not assigned to any agencies.
                      </TableCell>
                    </TableRow>
                  ) : (
                    staff.agencies.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {a.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="permissions">
          <Card>
            <CardContent className="pt-6">
              {(staff.permissions ?? []).length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No specific permissions granted. Role-based access applies.
                </p>
              ) : (
                <ul className="space-y-2">
                  {staff.permissions.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start justify-between gap-3 rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.key}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                      <Badge variant="outline">{p.category}</Badge>
                    </li>
                  ))}
                </ul>
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
