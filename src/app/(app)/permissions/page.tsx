import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";
import { RolesEditor } from "./roles-editor";

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

async function loadPermissions(): Promise<Permission[]> {
  try {
    const result = await api.get<Permission[] | { items: Permission[] }>(
      "/permissions",
    );
    return Array.isArray(result) ? result : (result.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("permissions fetch failed", error.status);
    }
    return [];
  }
}

export default async function PermissionsPage() {
  const [roles, permissions] = await Promise.all([
    loadRoles(),
    loadPermissions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Roles and the permissions assigned to each one."
      />
      {roles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No roles configured for this organization.
          </CardContent>
        </Card>
      ) : (
        <RolesEditor roles={roles} permissions={permissions} />
      )}
    </div>
  );
}
