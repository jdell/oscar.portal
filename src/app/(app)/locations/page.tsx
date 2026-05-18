import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      if (error.status === 429) throw error;
      console.error("locations fetch failed", error.status);
    }
    return [];
  }
}

export default async function LocationsPage() {
  const { data: locations, rateLimited } = await loadLocations()
    .then((data) => ({ data, rateLimited: false as boolean }))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 429)
        return { data: [] as Location[], rateLimited: true };
      throw error;
    });

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
      {rateLimited && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Too many requests</AlertTitle>
          <AlertDescription>
            The server is rate-limiting requests. Please wait a moment and
            refresh the page.
          </AlertDescription>
        </Alert>
      )}
      <LocationsTable data={locations} />
    </div>
  );
}
