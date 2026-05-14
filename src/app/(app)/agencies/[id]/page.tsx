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
  Building2,
  Users,
  CalendarDays,
  Landmark,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatName, cn } from "@/lib/utils";
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

const AVATAR_ACCENTS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

function avatarColor(name: string): string {
  const code = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

function agencyInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
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

  const locationCount = agency.locations?.length ?? 0;
  const cohortCount = agency.cohorts?.length ?? 0;
  const staffCount = agency.staff?.length ?? 0;
  const countyCount = agency.countiesDetail?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/agencies">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to agencies
        </Link>
      </Button>

      {/* Hero band */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: avatar + name */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white",
                  avatarColor(agency.name),
                )}
                aria-hidden="true"
              >
                {agencyInitials(agency.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">
                    {agency.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      active ? "bg-emerald-500" : "bg-zinc-400",
                    )}
                    title={active ? "Active" : "Inactive"}
                    aria-label={active ? "Active" : "Inactive"}
                  />
                </div>
                {(agency.shortName || agency.createdAt) && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[agency.shortName, agency.createdAt ? `Created ${formatDate(agency.createdAt)}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {/* Stat chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatChip
                    icon={<Building2 size={13} />}
                    label="Locations"
                    count={locationCount}
                  />
                  <StatChip
                    icon={<CalendarDays size={13} />}
                    label="Cohorts"
                    count={cohortCount}
                  />
                  <StatChip
                    icon={<Users size={13} />}
                    label="Staff"
                    count={staffCount}
                  />
                  <StatChip
                    icon={<Landmark size={13} />}
                    label="Counties"
                    count={countyCount}
                  />
                </div>
              </div>
            </div>
            {/* Right: actions */}
            <div className="flex shrink-0 items-center gap-2">
              <ForceSyncButton agencyId={agency.id} />
              <Button asChild variant="outline">
                <Link href={`/agencies/${agency.id}/edit`}>Edit</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column body: sidebar + tabs */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="shrink-0 space-y-0 lg:w-72">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ContactRow
                icon={<Mail size={14} />}
                href={agency.email ? `mailto:${agency.email}` : undefined}
              >
                {agency.email ?? "—"}
              </ContactRow>
              <ContactRow
                icon={<Phone size={14} />}
                href={agency.phone ? `tel:${agency.phone}` : undefined}
              >
                {agency.phone ?? "—"}
              </ContactRow>
              <ContactRow
                icon={<Globe size={14} />}
                href={agency.website ?? undefined}
                external
              >
                {agency.website ?? "—"}
              </ContactRow>
            </CardContent>

            <Separator />

            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm font-semibold">
                Executive Director
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCog size={14} className="shrink-0" />
                <span className="text-foreground">
                  {agency.director?.name ??
                    agency.directorName ??
                    "Not assigned"}
                </span>
              </div>
            </CardContent>

            <Separator />

            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm font-semibold">Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-0.5">
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
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={map} target="_blank" rel="noopener noreferrer">
                    <MapIcon className="mr-2 h-4 w-4" /> Open in Maps
                  </a>
                </Button>
              )}
              {agency.description && (
                <p className="text-muted-foreground">{agency.description}</p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Accordion sections */}
        <div className="min-w-0 flex-1 space-y-2">

          <AccordionSection
            icon={<Building2 size={15} />}
            label="Locations"
            count={locationCount}
          >
            {locationCount === 0 ? (
              <EmptyState
                icon={<Building2 size={32} />}
                label="No locations yet"
                description="Locations assigned to this agency will appear here."
              />
            ) : (
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
                  {agency.locations!.map((loc) => (
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
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionSection>

          <AccordionSection
            icon={<CalendarDays size={15} />}
            label="Cohorts"
            count={cohortCount}
          >
            {cohortCount === 0 ? (
              <EmptyState
                icon={<CalendarDays size={32} />}
                label="No cohorts yet"
                description="Cohorts linked to this agency will appear here."
              />
            ) : (
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
                  {agency.cohorts!.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">Cohort {c.pid}</TableCell>
                      <TableCell>{c.numberOfSessions}</TableCell>
                      <TableCell>{formatDate(c.startDate)}</TableCell>
                      <TableCell>{formatDate(c.endDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionSection>

          <AccordionSection
            icon={<Users size={15} />}
            label="Staff"
            count={staffCount}
          >
            {staffCount === 0 ? (
              <EmptyState
                icon={<Users size={32} />}
                label="No staff members yet"
                description="Staff assigned to this agency will appear here."
              />
            ) : (
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
                  {agency.staff!.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{formatName(s)}</TableCell>
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
            )}
          </AccordionSection>

          <AccordionSection
            label="Permissions"
            count={agency.permissionsDetail?.length ?? 0}
          >
            {(agency.permissionsDetail ?? []).length === 0 ? (
              <EmptyState
                icon="🔐"
                label="No permissions yet"
                description="Permissions granted to this agency will appear here."
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {agency.permissionsDetail!.map((p) => (
                  <Badge key={p.id} variant="outline" title={p.description}>
                    {p.description ?? p.key}
                  </Badge>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            label="Insurances"
            count={agency.insurersDetail?.length ?? 0}
          >
            {(agency.insurersDetail ?? []).length === 0 ? (
              <EmptyState
                icon="🏥"
                label="No insurances yet"
                description="Insurance plans accepted by this agency will appear here."
              />
            ) : (
              <SimpleList
                items={agency.insurersDetail!}
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
            )}
          </AccordionSection>

          <AccordionSection
            icon={<Landmark size={15} />}
            label="Counties"
            count={countyCount}
          >
            {countyCount === 0 ? (
              <EmptyState
                icon={<Landmark size={32} />}
                label="No counties yet"
                description="Counties served by this agency will appear here."
              />
            ) : (
              <SimpleList
                items={agency.countiesDetail!}
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
            )}
          </AccordionSection>

          <AccordionSection
            icon={<MapPin size={15} />}
            label="HL Resources"
            count={agency.healthyLivingResourcesDetail?.length ?? 0}
          >
            {(agency.healthyLivingResourcesDetail ?? []).length === 0 ? (
              <EmptyState
                icon={<MapPin size={32} />}
                label="No healthy living resources yet"
                description="Resources linked to this agency will appear here."
              />
            ) : (
              <SimpleList
                items={agency.healthyLivingResourcesDetail!}
                icon={<MapPin size={14} />}
                renderItem={(r) => (
                  <Link href={`/resources/${r.id}`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                )}
              />
            )}
          </AccordionSection>

          <AccordionSection
            icon={<MapPin size={15} />}
            label="Medical Resources"
            count={agency.medicalResourcesDetail?.length ?? 0}
          >
            {(agency.medicalResourcesDetail ?? []).length === 0 ? (
              <EmptyState
                icon={<MapPin size={32} />}
                label="No medical resources yet"
                description="Medical resources linked to this agency will appear here."
              />
            ) : (
              <SimpleList
                items={agency.medicalResourcesDetail!}
                icon={<MapPin size={14} />}
                renderItem={(r) => (
                  <Link href={`/resources/${r.id}`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                )}
              />
            )}
          </AccordionSection>

        </div>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function AccordionSection({
  icon,
  label,
  count,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <details
      open={count > 0}
      className="group rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <summary className="flex cursor-pointer select-none list-none items-center justify-between p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-foreground">{label}</span>
          {count > 0 && <CountBadge n={count} />}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}

function StatChip({
  icon,
  label,
  count,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  href?: string;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        count === 0
          ? "border-border text-muted-foreground"
          : "border-border bg-muted/50 text-foreground hover:bg-muted",
      )}
    >
      {icon}
      {count} {label}
    </span>
  );
  if (href && count > 0) {
    return <a href={href}>{content}</a>;
  }
  return content;
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-semibold text-primary">
      {n}
    </span>
  );
}

function ContactRow({
  icon,
  href,
  external,
  children,
}: {
  icon: React.ReactNode;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const isLink = !!href && children !== "—";
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="shrink-0">{icon}</span>
      {isLink ? (
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="truncate text-foreground hover:underline flex items-center gap-1"
        >
          {children}
          {external && <ExternalLink size={11} className="shrink-0 opacity-60" />}
        </a>
      ) : (
        <span className="truncate text-foreground">{children}</span>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="text-muted-foreground/40 [&>svg]:size-8">{icon}</span>
      <p className="font-medium text-foreground">{label}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function SimpleList<T extends { id: string | number }>({
  items,
  renderItem,
  icon,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  icon?: React.ReactNode;
}) {
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
