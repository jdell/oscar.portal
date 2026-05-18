import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  OrganizationSettingsForm,
  type OrganizationSettings,
} from "./organization-settings-form";

async function loadOrganization(
  id: string,
): Promise<OrganizationSettings | null> {
  try {
    return await api.get<OrganizationSettings>(`/organizations/${id}`);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) throw error;
      console.error("organization fetch failed", error.status);
    }
    return null;
  }
}

export default async function SettingsPage() {
  const session = await requireSession();
  const { data: org, rateLimited } = await loadOrganization(
    session.user.organizationId,
  )
    .then((data) => ({ data, rateLimited: false as boolean }))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 429)
        return { data: null, rateLimited: true };
      throw error;
    });

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Configuration for your organization."
      />
      {rateLimited && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Too many requests</AlertTitle>
          <AlertDescription>
            The server is rate-limiting requests. Please wait a moment and
            refresh the page.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm
            organizationId={session.user.organizationId}
            initial={
              org ?? {
                id: session.user.organizationId,
                name: session.user.organizationName,
              }
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Name">{session.user.displayName}</Row>
          <Row label="Email">{session.user.email}</Row>
          <Row label="Roles">{session.user.roles.join(", ") || "—"}</Row>
        </CardContent>
      </Card>
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
    <div className="flex justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium truncate">{children}</span>
    </div>
  );
}
