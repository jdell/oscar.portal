import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Building2, Shield } from "lucide-react";
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
  const endpoints = [
    `/medical-resources/${id}`,
    `/healthy-living-resources/${id}`,
  ];
  for (const path of endpoints) {
    try {
      return await api.get<ResourceDetail>(path);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) continue;
      if (error instanceof ApiError) {
        console.error(`${path} fetch failed`, error.status);
        continue;
      }
      throw error;
    }
  }
  return null;
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await loadResource(id);
  if (!resource) notFound();

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
          description={resource.resourceTypeName ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <Badge
                variant={resource.category === "medical" ? "default" : "secondary"}
              >
                {CATEGORY_LABELS[resource.category]}
              </Badge>
              <Badge variant={resource.isActive ? "default" : "outline"}>
                {resource.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/resources/${resource.id}/edit`}>Edit</Link>
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
            <Row icon={<Phone size={14} />}>{resource.phone ?? "—"}</Row>
            <Row icon={<Mail size={14} />}>{resource.email ?? "—"}</Row>
            <Row icon={<Globe size={14} />}>{resource.website ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<MapPin size={14} />}>{resource.location ?? "—"}</Row>
            <Row label="Type">{resource.resourceTypeName ?? "—"}</Row>
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

      <Tabs defaultValue="insurers">
        <TabsList>
          <TabsTrigger value="insurers">
            Insurances ({resource.insurers?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="agencies">
            Agencies ({resource.agencies?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="reasons">
            Reasons ({resource.referralReasons?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="insurers">
          <Card>
            <CardContent className="pt-6">
              {(resource.insurers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No insurances linked to this resource.
                </p>
              ) : (
                <ul className="space-y-2">
                  {resource.insurers.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center gap-3 rounded-md border p-3 text-sm"
                    >
                      <Shield
                        size={16}
                        className="text-muted-foreground shrink-0"
                      />
                      <span className="font-medium">{i.name}</span>
                      {i.shortName && (
                        <span className="text-xs text-muted-foreground">
                          ({i.shortName})
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
              {(resource.agencies ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No agencies linked to this resource.
                </p>
              ) : (
                <ul className="space-y-2">
                  {resource.agencies.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Building2
                          size={16}
                          className="text-muted-foreground shrink-0"
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
        <TabsContent value="reasons">
          <Card>
            <CardContent className="pt-6">
              {(resource.referralReasons ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No referral reasons configured.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {resource.referralReasons.map((r) => (
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
