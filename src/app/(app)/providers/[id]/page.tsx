import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Briefcase, Hash } from "lucide-react";
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
import type { Provider, Resource } from "@/lib/types";
import { formatName } from "@/lib/utils";
import { ProviderForm } from "../provider-form";

async function loadProvider(id: string): Promise<Provider | null> {
  try {
    return await api.get<Provider>(`/providers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

async function loadResources(): Promise<Resource[]> {
  try {
    const result = await api.get<Resource[] | { items: Resource[] }>(
      "/medical-resources",
    );
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch {
    return [];
  }
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [provider, resources] = await Promise.all([
    loadProvider(id),
    loadResources(),
  ]);
  if (!provider) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/providers">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to providers
          </Link>
        </Button>
        <PageHeader
          title={formatName(provider)}
          description={provider.specialty ?? undefined}
          action={
            <Badge variant={provider.isActive ? "default" : "secondary"}>
              {provider.isActive ? "Active" : "Inactive"}
            </Badge>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<Mail size={14} />}>{provider.email ?? "—"}</Row>
            <Row icon={<Phone size={14} />}>{provider.phone ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row icon={<Briefcase size={14} />}>
              {provider.specialty ?? "—"}
            </Row>
            <Row icon={<Hash size={14} />}>{provider.npi ?? "—"}</Row>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resource</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {provider.resourceName ?? (
              <span className="text-muted-foreground">Not linked</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Edit provider</h2>
        <ProviderForm resources={resources} initial={provider} />
      </div>
    </div>
  );
}

function Row({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
      </span>
      <span className="truncate text-foreground">{children}</span>
    </div>
  );
}
