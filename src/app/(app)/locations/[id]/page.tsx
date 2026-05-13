import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
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
import type { Location } from "@/lib/types";

async function loadLocation(id: string): Promise<Location | null> {
  try {
    return await api.get<Location>(`/class-locations/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await loadLocation(id);
  if (!location) notFound();

  const fullAddress = [
    location.address1,
    location.address2,
    [location.city, location.state, location.postalCode]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/locations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to locations
          </Link>
        </Button>
        <PageHeader
          title={location.name}
          description={location.description ?? undefined}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={location.isActive ? "default" : "secondary"}>
                {location.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/locations/${location.id}/edit`}>Edit</Link>
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-sky-600" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fullAddress ? (
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {fullAddress}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                No address on file.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Location ID">{location.id}</Row>
            {location.agencyId && (
              <Row label="Agency">
                <Link
                  href={`/agencies/${location.agencyId}`}
                  className="text-sky-600 hover:underline"
                >
                  {location.agencyId}
                </Link>
              </Row>
            )}
            <Row label="Status">{location.isActive ? "Active" : "Inactive"}</Row>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3 border-b py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground truncate">{children}</span>
    </div>
  );
}
