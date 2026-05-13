import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import { formatName } from "@/lib/utils";
import type { Provider, Resource } from "@/lib/types";
import { ProviderForm } from "../../provider-form";

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

export default async function EditProviderPage({
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
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/providers/${provider.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to provider
        </Link>
      </Button>
      <PageHeader title="Edit provider" description={formatName(provider)} />
      <ProviderForm resources={resources} initial={provider} />
    </div>
  );
}
