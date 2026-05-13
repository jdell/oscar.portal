import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Shield,
  Map as MapIcon,
  Users,
  Tag,
  Clipboard,
  Handshake,
  Layers,
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
import { formatDate } from "@/lib/utils";
import type { ResourceCategory, ResourceDetail } from "@/lib/types";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  medical: "Medical",
  healthy_living: "Healthy living",
};

async function loadResource(id: string): Promise<ResourceDetail | null> {
  const endpoints: {
    path: string;
    category: ResourceCategory;
  }[] = [
    { path: `/medical-resources/${id}`, category: "medical" },
    { path: `/healthy-living-resources/${id}`, category: "healthy_living" },
  ];
  for (const { path, category } of endpoints) {
    try {
      const result = await api.get<ResourceDetail>(path);
      return { ...result, category };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) continue;
      if (error instanceof ApiError) continue;
      throw error;
    }
  }
  return null;
}

function resourceActive(r: ResourceDetail): boolean {
  return r.active ?? r.isActive;
}

function fullAddress(r: ResourceDetail): string {
  const a = r.address;
  if (!a) return r.location ?? "—";
  const cityState = [a.state, a.zipCode].filter(Boolean).join(" ");
  return [a.street, a.city, cityState].filter(Boolean).join(", ");
}

function mapUrl(r: ResourceDetail): string | null {
  const a = r.address;
  if (a?.latitude != null && a?.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`;
  }
  const addr = fullAddress(r);
  if (!addr || addr === "—") return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

const TYPE_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-slate-100 text-slate-800",
];

function tone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return TYPE_TONES[Math.abs(hash) % TYPE_TONES.length];
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await loadResource(id);
  if (!resource) notFound();

  const isMedical = resource.category === "medical";
  const active = resourceActive(resource);
  const map = mapUrl(resource);
  const types = resource.resourceTypesDetail ?? [];
  const partners = resource.partnerTypesDetail ?? [];
  const programs = resource.programTypesDetail ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/resources">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to resources
          </Link>
        </Button>
        <PageHeader
          title={resource.name}
          description={fullAddress(resource)}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={isMedical ? "default" : "secondary"}>
                {CATEGORY_LABELS[resource.category]}
              </Badge>
              <Badge variant={active ? "default" : "outline"}>
                {active ? "Active" : "Inactive"}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/resources/${resource.id}/edit`}>Edit</Link>
              </Button>
            </div>
          }
        />
        {types.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {types.map((t) => (
              <span
                key={t.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(t.name)}`}
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(resource.phoneNumbers ?? []).length > 0 ? (
              resource.phoneNumbers!.map((p, i) => (
                <Row key={i} icon={<Phone size={14} />}>
                  {p.number}
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    {p.type}
                  </span>
                </Row>
              ))
            ) : (
              <Row icon={<Phone size={14} />}>{resource.phone ?? "—"}</Row>
            )}
            <Row icon={<Mail size={14} />}>{resource.email ?? "—"}</Row>
            <Row icon={<Globe size={14} />}>{resource.website ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 text-muted-foreground" />
              <span className="flex-1">{fullAddress(resource)}</span>
            </div>
            {map && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                <a href={map} target="_blank" rel="noopener noreferrer">
                  <MapIcon className="mr-2 h-4 w-4" /> Open in Maps
                </a>
              </Button>
            )}
            <Row label="Created">{formatDate(resource.createdAt)}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {resource.description ?? "No description provided."}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="types">
        <TabsList className="flex-wrap">
          <TabsTrigger value="types">
            <Tag className="mr-1 h-3.5 w-3.5" />
            Resource Types ({types.length})
          </TabsTrigger>
          <TabsTrigger value="insurances">
            <Shield className="mr-1 h-3.5 w-3.5" />
            Insurances ({resource.insurersDetail?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="agencies">
            <Building2 className="mr-1 h-3.5 w-3.5" />
            Agencies ({resource.agenciesDetail?.length ?? 0})
          </TabsTrigger>
          {isMedical && (
            <TabsTrigger value="reasons">
              <Clipboard className="mr-1 h-3.5 w-3.5" />
              Referral reasons ({resource.referralReasons?.length ?? 0})
            </TabsTrigger>
          )}
          {isMedical && (
            <TabsTrigger value="providers">
              <Users className="mr-1 h-3.5 w-3.5" />
              Providers ({resource.providersDetail?.length ?? 0})
            </TabsTrigger>
          )}
          {!isMedical && (
            <TabsTrigger value="partners">
              <Handshake className="mr-1 h-3.5 w-3.5" />
              Partner types ({partners.length})
            </TabsTrigger>
          )}
          {!isMedical && (
            <TabsTrigger value="programs">
              <Layers className="mr-1 h-3.5 w-3.5" />
              Program types ({programs.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="types">
          <Card>
            <CardContent className="pt-6">
              {types.length === 0 ? (
                <Empty
                  icon={<Tag className="h-8 w-8" />}
                  message="No resource types assigned."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <span
                      key={t.id}
                      className={`rounded-full px-3 py-1 text-sm font-medium ${tone(t.name)}`}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurances">
          <Card>
            <CardContent className="pt-6">
              {(resource.insurersDetail ?? []).length === 0 ? (
                <Empty
                  icon={<Shield className="h-8 w-8" />}
                  message="No insurances linked to this resource."
                />
              ) : (
                <ul className="space-y-2">
                  {resource.insurersDetail!.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center gap-3 rounded-md border p-3 text-sm"
                    >
                      <Shield size={16} className="shrink-0 text-muted-foreground" />
                      <span className="font-medium">{i.name}</span>
                      {i.type && (
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          ({i.type})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies">
          <Card>
            <CardContent className="pt-6">
              {(resource.agenciesDetail ?? []).length === 0 ? (
                <Empty
                  icon={<Building2 className="h-8 w-8" />}
                  message="No agencies linked to this resource."
                />
              ) : (
                <ul className="space-y-2">
                  {resource.agenciesDetail!.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Building2
                          size={16}
                          className="shrink-0 text-muted-foreground"
                        />
                        <Link
                          href={`/agencies/${a.id}`}
                          className="font-medium hover:underline"
                        >
                          {a.name}
                        </Link>
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

        {isMedical && (
          <TabsContent value="reasons">
            <Card>
              <CardContent className="pt-6">
                {(resource.referralReasons ?? []).length === 0 ? (
                  <Empty
                    icon={<Clipboard className="h-8 w-8" />}
                    message="No referral reasons configured."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resource.referralReasons!.map((r) => (
                      <Badge
                        key={r.id}
                        variant="outline"
                        title={r.description ?? undefined}
                      >
                        {r.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isMedical && (
          <TabsContent value="providers">
            <Card>
              <CardContent className="pt-6">
                {(resource.providersDetail ?? []).length === 0 ? (
                  <Empty
                    icon={<Users className="h-8 w-8" />}
                    message="No providers linked to this resource."
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {resource.providersDetail!.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-md border p-3 text-sm"
                      >
                        <Users
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span className="flex-1 truncate font-medium">
                          {p.name}
                        </span>
                        {p.active === false && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isMedical && (
          <TabsContent value="partners">
            <Card>
              <CardContent className="pt-6">
                {partners.length === 0 ? (
                  <Empty
                    icon={<Handshake className="h-8 w-8" />}
                    message="No partner types configured."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {partners.map((p) => (
                      <Badge
                        key={p.id}
                        variant="outline"
                        title={p.description ?? undefined}
                      >
                        {p.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isMedical && (
          <TabsContent value="programs">
            <Card>
              <CardContent className="pt-6">
                {programs.length === 0 ? (
                  <Empty
                    icon={<Layers className="h-8 w-8" />}
                    message="No program types configured."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {programs.map((p) => (
                      <Badge
                        key={p.id}
                        variant="outline"
                        title={p.description ?? undefined}
                      >
                        {p.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Empty({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
      <span className="opacity-50">{icon}</span>
      <p className="text-sm">{message}</p>
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
