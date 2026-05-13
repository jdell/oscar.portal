import { PageHeader } from "@/components/layout/page-header";
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
      console.error("organization fetch failed", error.status);
    }
    return null;
  }
}

export default async function SettingsPage() {
  const session = await requireSession();
  const org = await loadOrganization(session.user.organizationId);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Configuration for your organization."
      />

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
