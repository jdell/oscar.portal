import { api, ApiError } from "@/lib/api";
import type {
  AgencyFilterOptions,
  Permission,
  Resource,
  StaffMember,
} from "@/lib/types";

export interface LookupOption {
  id: string;
  name: string;
}

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    return await api.get<T>(path);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`lookup ${path} failed`, error.status);
    }
    return fallback;
  }
}

export async function loadAgencyFilterOptions(): Promise<AgencyFilterOptions> {
  return safeGet<AgencyFilterOptions>("/agencies/filter-options", {
    states: [],
    counties: [],
    insurers: [],
  });
}

export async function loadStaffForDirector(): Promise<LookupOption[]> {
  const list = await safeGet<StaffMember[] | { items: StaffMember[] }>(
    "/staff-members",
    [],
  );
  const items = Array.isArray(list) ? list : list.items ?? [];
  return items.map((s) => ({
    id: s.id,
    name:
      s.name ??
      [s.firstName, s.lastName].filter(Boolean).join(" ") ??
      s.email,
  }));
}

export async function loadResources(
  category: "medical" | "healthy-living",
): Promise<LookupOption[]> {
  const path =
    category === "medical" ? "/resources/medical" : "/resources/healthy-living";
  const list = await safeGet<Resource[] | { items: Resource[] }>(path, []);
  const items = Array.isArray(list) ? list : list.items ?? [];
  return items.map((r) => ({ id: r.id, name: r.name }));
}

export async function loadPermissions(): Promise<LookupOption[]> {
  const list = await safeGet<Permission[] | { items: Permission[] }>(
    "/permissions",
    [],
  );
  const items = Array.isArray(list) ? list : list.items ?? [];
  return items.map((p) => ({
    id: p.id,
    name: p.description ?? p.key,
  }));
}

export interface AgencyLookups {
  filterOptions: AgencyFilterOptions;
  staff: LookupOption[];
  healthyLivingResources: LookupOption[];
  medicalResources: LookupOption[];
  permissions: LookupOption[];
}

export async function loadAgencyLookups(): Promise<AgencyLookups> {
  const [filterOptions, staff, hlResources, medResources, permissions] =
    await Promise.all([
      loadAgencyFilterOptions(),
      loadStaffForDirector(),
      loadResources("healthy-living"),
      loadResources("medical"),
      loadPermissions(),
    ]);
  return {
    filterOptions,
    staff,
    healthyLivingResources: hlResources,
    medicalResources: medResources,
    permissions,
  };
}
