import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Location } from "@/lib/types";
import { LocationForm } from "../../location-form";

async function loadLocation(id: string): Promise<Location | null> {
  try {
    return await api.get<Location>(`/class-locations/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await loadLocation(id);
  if (!location) notFound();
  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/locations/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to location
        </Link>
      </Button>
      <PageHeader title={`Edit ${location.name}`} />
      <LocationForm initial={location} />
    </div>
  );
}
