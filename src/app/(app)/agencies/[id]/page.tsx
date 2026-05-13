import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Globe, MapPin } from "lucide-react";
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
import type { AgencyDetail } from "@/lib/types";

async function loadAgency(id: string): Promise<AgencyDetail | null> {
  try {
    return await api.get<AgencyDetail>(`/agencies/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agency = await loadAgency(id);
  if (!agency) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/agencies">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to agencies
          </Link>
        </Button>
        <PageHeader
          title={agency.name}
          description={agency.shortName ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {agency.status}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/agencies/${agency.id}/edit`}>Edit</Link>
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
            <Row icon={<Mail size={14} />}>{agency.email ?? "—"}</Row>
            <Row icon={<Phone size={14} />}>{agency.phone ?? "—"}</Row>
            <Row icon={<Globe size={14} />}>{agency.website ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Staff">{agency.staffCount}</Row>
            <Row label="Locations">{agency.locations?.length ?? 0}</Row>
            <Row label="Created">{formatDate(agency.createdAt)}</Row>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {agency.description ?? "No description provided."}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">
            Staff ({agency.staff?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="locations">
            Locations ({agency.locations?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="staff">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(agency.staff ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No staff assigned to this agency.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (agency.staff ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {formatName(s)}
                        </TableCell>
                        <TableCell>{s.title ?? "—"}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>
                          <Badge variant={s.isActive ? "default" : "secondary"}>
                            {s.isActive ? "Active" : "Inactive"}
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
        <TabsContent value="locations">
          <Card>
            <CardContent className="pt-6">
              {(agency.locations ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No locations associated with this agency.
                </p>
              ) : (
                <ul className="space-y-3">
                  {agency.locations.map((loc) => (
                    <li
                      key={loc.id}
                      className="flex items-start gap-3 rounded-md border p-3"
                    >
                      <MapPin
                        size={16}
                        className="text-muted-foreground mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{loc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            loc.address1,
                            loc.city,
                            loc.state,
                            loc.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "No address on file"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resources">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Resource associations coming soon.
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
