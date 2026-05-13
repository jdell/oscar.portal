import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Map as MapIcon,
  UserCog,
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
import { ForceSyncButton } from "./force-sync-button";

async function loadAgency(id: string): Promise<AgencyDetail | null> {
  try {
    return await api.get<AgencyDetail>(`/agencies/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

function isActive(agency: AgencyDetail): boolean {
  return agency.active ?? agency.status === "active";
}

function fullAddress(agency: AgencyDetail): string {
  const a = agency.address;
  if (!a) return agency.primaryLocation ?? "—";
  const cityState = [a.state, a.zipCode].filter(Boolean).join(" ");
  return [a.street, a.city, cityState].filter(Boolean).join(", ");
}

function mapUrl(agency: AgencyDetail): string | null {
  const a = agency.address;
  if (a?.latitude != null && a?.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`;
  }
  const addr = fullAddress(agency);
  if (!addr || addr === "—") return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

export default async function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agency = await loadAgency(id);
  if (!agency) notFound();

  const active = isActive(agency);
  const map = mapUrl(agency);

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
              <Badge variant={active ? "default" : "secondary"}>
                {active ? "Active" : "Inactive"}
              </Badge>
              <ForceSyncButton agencyId={agency.id} />
              <Button asChild variant="outline">
                <Link href={`/agencies/${agency.id}/edit`}>Edit</Link>
              </Button>
            </div>
          }
        />
      </div>

      <Tabs defaultValue="info">
        <TabsList className="flex-wrap">
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="locations">
            Locations ({agency.locations?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="cohorts">
            Cohorts ({agency.cohorts?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions ({agency.permissionsDetail?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="insurances">
            Insurances ({agency.insurersDetail?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="counties">
            Counties ({agency.countiesDetail?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="hl-resources">
            HL Resources ({agency.healthyLivingResourcesDetail?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="medical-resources">
            Medical Resources ({agency.medicalResourcesDetail?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Name">{agency.name}</Row>
                <Row label="Short name">{agency.shortName ?? "—"}</Row>
                <Row label="Created">{formatDate(agency.createdAt)}</Row>
              </CardContent>
            </Card>
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
                <CardTitle className="text-sm">Executive Director</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row icon={<UserCog size={14} />}>
                  {agency.director?.name ??
                    agency.directorName ??
                    "Not assigned"}
                </Row>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm">Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p>{agency.address?.street ?? "—"}</p>
                    <p className="text-muted-foreground">
                      {[
                        agency.address?.city,
                        agency.address?.state,
                        agency.address?.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                  {map && (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={map}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open in Google Maps"
                      >
                        <MapIcon className="mr-2 h-4 w-4" /> Open in Maps
                      </a>
                    </Button>
                  )}
                </div>
                {agency.description && (
                  <p className="mt-4 text-muted-foreground">
                    {agency.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>ZIP</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(agency.locations ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No locations for this agency.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agency.locations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        <TableCell>{loc.description ?? "—"}</TableCell>
                        <TableCell>{loc.address1 ?? "—"}</TableCell>
                        <TableCell>{loc.city ?? "—"}</TableCell>
                        <TableCell>{loc.state ?? "—"}</TableCell>
                        <TableCell>{loc.postalCode ?? "—"}</TableCell>
                        <TableCell>
                          {!loc.isArchived ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="secondary">Archived</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Date from</TableHead>
                    <TableHead>Date to</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(agency.cohorts ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No cohorts for this agency.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agency.cohorts!.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          Cohort {c.pid}
                        </TableCell>
                        <TableCell>{c.numberOfSessions}</TableCell>
                        <TableCell>{formatDate(c.startDate)}</TableCell>
                        <TableCell>{formatDate(c.endDate)}</TableCell>
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
              {(agency.permissionsDetail ?? []).length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No permissions for this agency.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {agency.permissionsDetail!.map((p) => (
                    <Badge
                      key={p.id}
                      variant="outline"
                      title={p.description}
                    >
                      {p.description ?? p.key}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurances">
          <Card>
            <CardContent className="pt-6">
              <SimpleList
                items={agency.insurersDetail ?? []}
                empty="No insurances for this agency."
                renderItem={(i) => (
                  <>
                    <span className="font-medium">{i.name}</span>
                    {i.type && (
                      <span className="ml-2 text-xs text-muted-foreground capitalize">
                        ({i.type})
                      </span>
                    )}
                  </>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counties">
          <Card>
            <CardContent className="pt-6">
              <SimpleList
                items={agency.countiesDetail ?? []}
                empty="No counties for this agency."
                renderItem={(c) => (
                  <>
                    <span className="font-medium">{c.name}</span>
                    {c.state && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.state}
                      </span>
                    )}
                  </>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hl-resources">
          <Card>
            <CardContent className="pt-6">
              <SimpleList
                items={agency.healthyLivingResourcesDetail ?? []}
                empty="No healthy living resources for this agency."
                renderItem={(r) => (
                  <Link
                    href={`/resources/${r.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.name}
                  </Link>
                )}
                icon={<MapPin size={14} />}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical-resources">
          <Card>
            <CardContent className="pt-6">
              <SimpleList
                items={agency.medicalResourcesDetail ?? []}
                empty="No medical resources for this agency."
                renderItem={(r) => (
                  <Link
                    href={`/resources/${r.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.name}
                  </Link>
                )}
                icon={<MapPin size={14} />}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {agency.staff && agency.staff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Staff ({agency.staff.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                {agency.staff.map((s) => (
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SimpleList<T extends { id: string | number }>({
  items,
  empty,
  renderItem,
  icon,
}: {
  items: T[];
  empty: string;
  renderItem: (item: T) => React.ReactNode;
  icon?: React.ReactNode;
}) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-md border p-3 text-sm"
        >
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {renderItem(item)}
        </li>
      ))}
    </ul>
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
