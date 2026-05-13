import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import type { Role } from "@/lib/types";

async function loadRoles(): Promise<Role[]> {
  try {
    const result = await api.get<Role[] | { items: Role[] }>("/roles");
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("roles fetch failed", error.status);
    }
    return [];
  }
}

export default async function PermissionsPage() {
  const roles = await loadRoles();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Roles and permissions in your organization."
      />
      {roles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No roles configured for this organization.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="text-base">{role.name}</CardTitle>
                {role.description && (
                  <p className="text-xs text-muted-foreground">
                    {role.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No permissions assigned.
                    </span>
                  ) : (
                    role.permissions.map((p) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
