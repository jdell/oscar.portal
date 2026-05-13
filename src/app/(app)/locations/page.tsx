import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Location } from "@/lib/types";
import { LocationsTable } from "./locations-table";

async function loadLocations(): Promise<Location[]> {
  try {
    const result = await api.get<Location[] | { items: Location[] }>(
      "/locations",
    );
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("locations fetch failed", error.status);
    }
    return [];
  }
}

export default async function LocationsPage() {
  const locations = await loadLocations();
  return (
    <div>
      <PageHeader
        title="Locations"
        description="Physical locations within your organization."
      />
      <LocationsTable data={locations} />
    </div>
  );
}
