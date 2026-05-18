import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      if (error.status === 429) throw error;
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
      if (error.status === 429) throw error;
      console.error("permissions fetch failed", error.status);
    }
    return [];
  }
}

export default async function PermissionsPage() {
  const { roles, permissions, rateLimited } = await Promise.all([
    loadRoles(),
    loadPermissions(),
  ])
    .then(([roles, permissions]) => ({ roles, permissions, rateLimited: false as boolean }))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 429)
        return { roles: [] as Role[], permissions: [] as Permission[], rateLimited: true };
      throw error;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Roles and the permissions assigned to each one."
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
