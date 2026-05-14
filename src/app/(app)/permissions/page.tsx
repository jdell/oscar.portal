import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";
import { RolesEditor } from "./roles-editor";

async function loadRoles(): Promise<Role[]> {
  try {
    const result = await api.get<Role[] | { items: Role[] }>("/roles");
    const raw = Array.isArray(result) ? result : (result.items ?? []);
    return raw.map((r) => ({ ...r, permissions: r.permissions ?? [] }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("roles fetch failed", error.status);
    }
    return [];
  }
}

async function loadPermissions(): Promise<Permission[]> {
  try {
    const result = await api.get<
      { id: number; code: string; description: string; category?: string }[]
      | { items: { id: number; code: string; description: string; category?: string }[] }
    >("/permissions");
    const raw = Array.isArray(result) ? result : (result.items ?? []);
    return raw.map((p) => ({
      id: String(p.id),
      key: p.code,
      description: p.description ?? "",
      category: p.category ?? "",
    }));
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
      {permissions.length === 0 && roles.length > 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            No permissions catalog returned by the API. The portal expects
            permissions with{" "}
            <code className="text-xs">{`{ id, key, description, category }`}</code>{" "}
            (the loader maps Angular&apos;s <code>code</code> field to{" "}
            <code>key</code> and defaults <code>category</code> to an empty
            string). If the API is the Angular contract only, role editing
            here will appear empty until the backend exposes the richer shape.
          </CardContent>
        </Card>
      )}
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
