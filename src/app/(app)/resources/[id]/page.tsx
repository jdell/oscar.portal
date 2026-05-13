import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Globe, MapPin, Clock } from "lucide-react";
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
import type { ResourceCategory, ResourceDetail } from "@/lib/types";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  medical: "Medical",
  healthy_living: "Healthy living",
};

const CATEGORY_BADGE: Record<ResourceCategory, string> = {
  medical: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  healthy_living: "bg-green-100 text-green-800 hover:bg-green-100",
};

function pathFor(category: ResourceCategory | undefined): string {
  return category === "healthy_living"
    ? "/healthy-living-resources"
    : "/medical-resources";
}

async function loadResource(
  id: string,
  hint?: ResourceCategory,
): Promise<ResourceDetail | null> {
  const attempts: ResourceCategory[] = hint
    ? [hint, hint === "medical" ? "healthy_living" : "medical"]
    : ["medical", "healthy_living"];
  for (const cat of attempts) {
    try {
      const result = await api.get<ResourceDetail>(`${pathFor(cat)}/${id}`);
      return { ...result, category: cat };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }
  return null;
}

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ id }, { category }] = await Promise.all([params, searchParams]);
  const hint =
    category === "medical" || category === "healthy_living"
      ? (category as ResourceCategory)
      : undefined;
  const resource = await loadResource(id, hint);
  if (!resource) notFound();

  const address = [
    resource.address1,
    resource.address2,
    [resource.city, resource.state, resource.postalCode]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");

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
              <Badge className={CATEGORY_BADGE[resource.category]}>
                {CATEGORY_LABELS[resource.category]}
              </Badge>
              <Badge variant={resource.isActive ? "default" : "secondary"}>
                {resource.isActive ? "Active" : "Inactive"}
              </Badge>
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
            <Row icon={<Mail size={14} />}>{resource.email ?? "—"}</Row>
            <Row icon={<Phone size={14} />}>{resource.phone ?? "—"}</Row>
            <Row icon={<Globe size={14} />}>{resource.website ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<MapPin size={14} />}>{address || "—"}</Row>
            <Row icon={<Clock size={14} />}>{resource.hours ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Services</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {resource.services ?? "—"}
            {resource.category === "medical" && (
              <p className="mt-2">
                {resource.acceptingPatients
                  ? "Accepting new patients"
                  : "Not accepting new patients"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insurances">
        <TabsList>
          <TabsTrigger value="insurances">
            Insurances ({resource.insurers?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="agencies">
            Agencies ({resource.agencies?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="referrals">
            Referral reasons ({resource.referralReasons?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="insurances">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(resource.insurers ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No insurances linked.
                      </TableCell>
                    </TableRow>
                  ) : (
                    resource.insurers.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        <TableCell>{i.phone ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={i.isActive ? "default" : "secondary"}>
                            {i.isActive ? "Active" : "Inactive"}
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
                  {(resource.agencies ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No agencies linked.
                      </TableCell>
                    </TableRow>
                  ) : (
                    resource.agencies.map((a) => (
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
        <TabsContent value="referrals">
          <Card>
            <CardContent className="pt-6">
              {(resource.referralReasons ?? []).length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No referral reasons configured.
                </p>
              ) : (
                <ul className="space-y-2">
                  {resource.referralReasons.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-md border p-3"
                    >
                      <p className="text-sm font-medium">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground">
                          {r.description}
                        </p>
                      )}
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
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="truncate text-right text-foreground">{children}</span>
    </div>
  );
}
