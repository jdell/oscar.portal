import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { Provider } from "@/lib/types";
import { ProvidersTable } from "./providers-table";

async function loadProviders(): Promise<Provider[]> {
  try {
    const result = await api.get<Provider[] | { items: Provider[] }>(
      "/providers",
    );
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("providers fetch failed", error.status);
    }
    return [];
  }
}

export default async function ProvidersPage() {
  const providers = await loadProviders();
  return (
    <div>
      <PageHeader
        title="Providers"
        description="Healthcare providers associated with your organization."
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/providers/new">
              <Plus className="mr-2 h-4 w-4" /> New provider
            </Link>
          </Button>
        }
      />
      <ProvidersTable data={providers} />
    </div>
  );
}
