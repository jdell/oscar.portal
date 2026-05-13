import type { Provider } from "@/lib/types";

export interface ProviderSpecialtyBreakdown {
  key: string;
  label: string;
  count: number;
}

export interface ProviderSummary {
  total: number;
  active: number;
  inactive: number;
  bySpecialty: ProviderSpecialtyBreakdown[];
}

export const UNKNOWN_SPECIALTY_KEY = "__unknown__";

const SPECIALTY_TAG_CLASSES = [
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
] as const;

export function specialtyKey(provider: Provider): string {
  const name = provider.participationType?.name?.trim();
  return name ? name.toLowerCase() : UNKNOWN_SPECIALTY_KEY;
}

export function specialtyLabel(provider: Provider): string {
  return provider.participationType?.name?.trim() ?? "";
}

export function specialtyTagClasses(key: string): string {
  if (!key || key === UNKNOWN_SPECIALTY_KEY) {
    return "bg-muted text-muted-foreground";
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return SPECIALTY_TAG_CLASSES[
    Math.abs(hash) % SPECIALTY_TAG_CLASSES.length
  ];
}

export function splitProviderName(name: string | undefined | null): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
  };
}

export function computeProviderSummary(
  providers: Provider[],
): ProviderSummary {
  const breakdown = new Map<string, ProviderSpecialtyBreakdown>();
  let active = 0;
  let inactive = 0;
  for (const p of providers) {
    if (p.active) active++;
    else inactive++;
    const key = specialtyKey(p);
    const label = specialtyLabel(p);
    const existing = breakdown.get(key);
    if (existing) existing.count++;
    else breakdown.set(key, { key, label, count: 1 });
  }
  return {
    total: providers.length,
    active,
    inactive,
    bySpecialty: [...breakdown.values()].sort((a, b) => b.count - a.count),
  };
}
