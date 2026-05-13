import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { Location } from "@/lib/types";
import { LocationsTable } from "./locations-table";

async function loadLocations(): Promise<Location[]> {
  try {
    const result = await api.get<Location[] | { items: Location[] }>(
      "/class-locations",
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
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/locations/new">
              <Plus className="mr-2 h-4 w-4" /> New location
            </Link>
          </Button>
        }
      />
      <LocationsTable data={locations} />
    </div>
  );
}
