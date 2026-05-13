import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { Resource } from "@/lib/types";
import { ResourcesTable } from "./resources-table";

async function loadResources(): Promise<Resource[]> {
  const safeFetch = async (path: string): Promise<Resource[]> => {
    try {
      const result = await api.get<Resource[] | { items: Resource[] }>(path);
      return Array.isArray(result) ? result : (result.items ?? []);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`${path} fetch failed`, error.status);
      }
      return [];
    }
  };

  const [medical, healthy] = await Promise.all([
    safeFetch("/medicalresources"),
    safeFetch("/healthylivingresources"),
  ]);

  return [
    ...medical.map((r) => ({ ...r, category: "medical" as const })),
    ...healthy.map((r) => ({ ...r, category: "healthy_living" as const })),
  ];
}

export default async function ResourcesPage() {
  const resources = await loadResources();
  return (
    <div>
      <PageHeader
        title="Resources"
        description="Medical and healthy living resources available to your organization."
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/resources/new">
              <Plus className="mr-2 h-4 w-4" /> New resource
            </Link>
          </Button>
        }
      />
      <ResourcesTable data={resources} />
    </div>
  );
}
