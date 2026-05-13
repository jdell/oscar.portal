import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Resource } from "@/lib/types";
import { ProviderForm } from "../provider-form";

async function loadResources(): Promise<Resource[]> {
  try {
    const result = await api.get<Resource[] | { items: Resource[] }>(
      "/medical-resources",
    );
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("resources fetch failed", error.status);
    }
    return [];
  }
}

export default async function NewProviderPage() {
  const resources = await loadResources();
  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/providers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to providers
        </Link>
      </Button>
      <PageHeader
        title="New provider"
        description="Add a healthcare provider to your organization."
      />
      <ProviderForm resources={resources} />
    </div>
  );
}
