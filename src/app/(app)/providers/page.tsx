import { PageHeader } from "@/components/layout/page-header";
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
      />
      <ProvidersTable data={providers} />
    </div>
  );
}
