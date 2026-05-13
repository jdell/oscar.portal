import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import type {
  MedicalResourceSummary,
  Provider,
  ProviderParticipationType,
} from "@/lib/types";

async function loadProvider(id: string): Promise<Provider | null> {
  try {
    return await api.get<Provider>(`/providers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

async function hydrate(p: Provider): Promise<Provider> {
  if (p.participationType && p.medicalResource) return p;
  try {
    const [pts, mrs] = await Promise.all([
      api.get<
        ProviderParticipationType[] | { items: ProviderParticipationType[] }
      >("/participation-types"),
      api.get<MedicalResourceSummary[] | { items: MedicalResourceSummary[] }>(
        "/medical-resources",
      ),
    ]);
    const ptList = Array.isArray(pts) ? pts : (pts.items ?? []);
    const mrList = Array.isArray(mrs) ? mrs : (mrs.items ?? []);
    return {
      ...p,
      participationType:
        p.participationType ??
        ptList.find((t) => t.id === p.providerParticipationTypeId) ??
        null,
      medicalResource:
        p.medicalResource ??
        mrList.find((m) => m.id === p.medicalResourceId) ??
        null,
    };
  } catch {
    return p;
  }
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await loadProvider(id);
  if (!raw) notFound();
  const provider = await hydrate(raw);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/providers">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to providers
          </Link>
        </Button>
        <PageHeader
          title={provider.name}
          description={provider.participationType?.name ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={provider.active ? "default" : "secondary"}>
                {provider.active ? "Active" : "Inactive"}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/providers/${provider.id}/edit`}>Edit</Link>
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<Mail size={14} />}>{provider.emailAddress ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<Stethoscope size={14} />}>
              {provider.participationType?.name ?? "—"}
            </Row>
            <Row icon={<Building2 size={14} />}>
              {provider.medicalResource ? (
                <span className="flex flex-col items-end">
                  <span className="font-medium">
                    {provider.medicalResource.name}
                  </span>
                  {(provider.medicalResource.address?.city ||
                    provider.medicalResource.address?.state) && (
                    <span className="text-xs text-muted-foreground">
                      {[
                        provider.medicalResource.address?.city,
                        provider.medicalResource.address?.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                </span>
              ) : (
                "—"
              )}
            </Row>
          </CardContent>
        </Card>
      </div>
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
