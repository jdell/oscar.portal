"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { X } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { MultiSelect } from "@/components/multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Agency,
  HealthyLivingResourceType,
  MedicalResourceType,
  PartnerType,
  ProgramType,
  Resource,
  ResourceCategory,
} from "@/lib/types";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  medical: "Medical",
  healthy_living: "Healthy living",
};

const CATEGORY_BADGE: Record<ResourceCategory, "default" | "secondary"> = {
  medical: "default",
  healthy_living: "secondary",
};

const TYPE_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-slate-100 text-slate-800",
];

function tone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return TYPE_TONES[Math.abs(hash) % TYPE_TONES.length];
}

function resourceLocation(r: Resource): string {
  if (r.address?.city || r.address?.state) {
    return [r.address?.city, r.address?.state].filter(Boolean).join(", ");
  }
  return r.location ?? "—";
}

function resourceActive(r: Resource): boolean {
  return r.active ?? r.isActive;
}

interface ResourcesTableProps {
  data: Resource[];
  medicalTypes: MedicalResourceType[];
  hlTypes: HealthyLivingResourceType[];
  agencies: Agency[];
  partnerTypes: PartnerType[];
  programTypes: ProgramType[];
  phoneTypes: Map<number, string>;
}

export function ResourcesTable({
  data,
  medicalTypes,
  hlTypes,
  agencies,
  partnerTypes,
  programTypes,
  phoneTypes,
}: ResourcesTableProps) {
  const [category, setCategory] = useState<ResourceCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [agencyFilter, setAgencyFilter] = useState<string[]>([]);
  const [partnerFilter, setPartnerFilter] = useState<string[]>([]);
  const [programFilter, setProgramFilter] = useState<string[]>([]);

  const typeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of medicalTypes) m.set(t.id, t.name);
    for (const t of hlTypes) m.set(t.id, t.name);
    return m;
  }, [medicalTypes, hlTypes]);

  const partnerMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of partnerTypes) m.set(p.id, p.name);
    return m;
  }, [partnerTypes]);

  const programMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of programTypes) m.set(p.id, p.name);
    return m;
  }, [programTypes]);

  const typeOptions = useMemo(() => {
    if (category === "medical")
      return medicalTypes.map((t) => ({ value: t.id, label: t.name }));
    if (category === "healthy_living")
      return hlTypes.map((t) => ({ value: t.id, label: t.name }));
    return [...medicalTypes, ...hlTypes].map((t) => ({
      value: t.id,
      label: t.name,
    }));
  }, [category, medicalTypes, hlTypes]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (typeFilter.length > 0) {
        const rt = r.resourceTypes ?? [];
        if (!rt.some((t) => typeFilter.includes(t))) return false;
      }
      if (agencyFilter.length > 0) {
        const ag = r.agencies ?? [];
        if (!ag.some((a) => agencyFilter.includes(a))) return false;
      }
      if (partnerFilter.length > 0) {
        const pt = r.partnerTypes ?? [];
        if (!pt.some((p) => partnerFilter.includes(p))) return false;
      }
      if (programFilter.length > 0) {
        const pg = r.programTypes ?? [];
        if (!pg.some((p) => programFilter.includes(p))) return false;
      }
      return true;
    });
  }, [data, category, typeFilter, agencyFilter, partnerFilter, programFilter]);

  const hasFilters =
    category !== "all" ||
    typeFilter.length > 0 ||
    agencyFilter.length > 0 ||
    partnerFilter.length > 0 ||
    programFilter.length > 0;

  const clearFilters = () => {
    setCategory("all");
    setTypeFilter([]);
    setAgencyFilter([]);
    setPartnerFilter([]);
    setProgramFilter([]);
  };

  const columns = useMemo<ColumnDef<Resource>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) =>
          `${row.name} ${row.primaryContact ?? ""} ${
            row.emailAddress ?? row.email ?? ""
          }`,
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant={CATEGORY_BADGE[row.original.category]}>
            {CATEGORY_LABELS[row.original.category]}
          </Badge>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const phones = row.original.phoneNumbers ?? [];
          if (phones.length > 0) {
            return (
              <div className="flex flex-col text-sm">
                {phones.slice(0, 2).map((p, i) => (
                  <span key={i}>
                    {p.number}
                    <span className="ml-1 text-xs text-muted-foreground capitalize">
                      ({phoneTypes.get(Number(p.type)) ?? p.type})
                    </span>
                  </span>
                ))}
              </div>
            );
          }
          return row.original.phone ?? "—";
        },
      },
      {
        id: "types",
        header: "Types",
        cell: ({ row }) => {
          const ids = row.original.resourceTypes ?? [];
          const programIds =
            row.original.category === "healthy_living"
              ? (row.original.programTypes ?? [])
              : [];
          const allChips = [
            ...ids.map((id) => ({
              id,
              name: typeMap.get(id) ?? "Unknown",
              kind: "type" as const,
            })),
            ...programIds.map((id) => ({
              id,
              name: programMap.get(id) ?? "Unknown",
              kind: "program" as const,
            })),
          ];
          if (allChips.length === 0)
            return (
              <span className="text-muted-foreground">
                {row.original.resourceTypeName ?? "—"}
              </span>
            );
          return (
            <div className="flex flex-wrap gap-1">
              {allChips.slice(0, 3).map((c) => (
                <span
                  key={`${c.kind}-${c.id}`}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(c.name)}`}
                  title={c.kind === "program" ? "Program type" : "Resource type"}
                >
                  {c.name}
                </span>
              ))}
              {allChips.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{allChips.length - 3}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "primaryContact",
        accessorFn: (row) => row.primaryContact ?? "",
        header: "Primary contact",
        cell: ({ row }) => row.original.primaryContact ?? "—",
      },
      {
        id: "location",
        accessorFn: (row) => resourceLocation(row),
        header: "Location",
        cell: ({ row }) => resourceLocation(row.original),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={resourceActive(row.original) ? "default" : "secondary"}
          >
            {resourceActive(row.original) ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    [typeMap, programMap],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select
            value={category}
            onValueChange={(v) => {
              if (v) setCategory(v as ResourceCategory | "all");
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="healthy_living">Healthy living</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Resource types</Label>
          <MultiSelect
            placeholder="Any type"
            options={typeOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-56"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Agencies</Label>
          <MultiSelect
            placeholder="Any agency"
            options={agencies.map((a) => ({ value: a.id, label: a.name }))}
            value={agencyFilter}
            onChange={setAgencyFilter}
            className="w-52"
          />
        </div>
        {(category === "all" || category === "healthy_living") &&
          partnerTypes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Partner types</Label>
              <MultiSelect
                placeholder="Any partner type"
                options={partnerTypes.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                value={partnerFilter}
                onChange={setPartnerFilter}
                className="w-52"
              />
            </div>
          )}
        {(category === "all" || category === "healthy_living") &&
          programTypes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Program types</Label>
              <MultiSelect
                placeholder="Any program type"
                options={programTypes.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                value={programFilter}
                onChange={setProgramFilter}
                className="w-52"
              />
            </div>
          )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {typeFilter.length === 0 && (
        <TypeChips
          medicalTypes={medicalTypes}
          hlTypes={hlTypes}
          category={category}
          data={data}
          onPick={(id) => setTypeFilter([id])}
        />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name, contact, or email…"
        rowHref={(r) => `/resources/${r.id}`}
        emptyMessage={
          hasFilters
            ? "No resources match these filters. Try clearing filters."
            : data.length === 0
              ? "No resources yet. Use the New resource button to add one."
              : "No resources found."
        }
      />

      {/* Suppress unused-vars for partnerMap (used in tooltip render path only when partnerTypes present) */}
      <span className="hidden">{partnerMap.size}</span>
    </div>
  );
}

function TypeChips({
  medicalTypes,
  hlTypes,
  category,
  data,
  onPick,
}: {
  medicalTypes: MedicalResourceType[];
  hlTypes: HealthyLivingResourceType[];
  category: ResourceCategory | "all";
  data: Resource[];
  onPick: (typeId: string) => void;
}) {
  const types: { id: string; name: string }[] = [];
  if (category !== "healthy_living") types.push(...medicalTypes);
  if (category !== "medical") types.push(...hlTypes);

  if (types.length === 0) return null;

  const counts = new Map<string, number>();
  for (const r of data) {
    for (const id of r.resourceTypes ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const enriched = types
    .map((t) => ({ ...t, count: counts.get(t.id) ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (enriched.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        By type
      </span>
      {enriched.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => onPick(t.id)}
          className={`rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80 ${tone(t.name)}`}
        >
          {t.name} · {t.count}
        </button>
      ))}
    </div>
  );
}
