"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, CheckCircle2, MapPin, X } from "lucide-react";
import { DataTable } from "@/components/data-table";
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
import { cn } from "@/lib/utils";
import type { Location } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";
type CityFilter = "all" | string;

function formatAddress(loc: Location): string {
  return [loc.address1, loc.address2].filter(Boolean).join(", ") || "—";
}

export function LocationsTable({ data }: { data: Location[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cityFilter, setCityFilter] = useState<CityFilter>("all");

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const l of data) {
      const c = l.city?.trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const summary = useMemo(() => {
    const total = data.length;
    const active = data.filter((l) => l.isActive).length;
    return { total, active, cityCount: cities.length };
  }, [data, cities]);

  const filtered = useMemo(() => {
    return data.filter((l) => {
      if (statusFilter === "active" && !l.isActive) return false;
      if (statusFilter === "inactive" && l.isActive) return false;
      if (cityFilter !== "all" && (l.city?.trim() ?? "") !== cityFilter) {
        return false;
      }
      return true;
    });
  }, [data, statusFilter, cityFilter]);

  const hasActiveFilters = statusFilter !== "all" || cityFilter !== "all";

  function clearFilters() {
    setStatusFilter("all");
    setCityFilter("all");
  }

  const columns = useMemo<ColumnDef<Location>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground truncate">
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "address",
        header: "Address",
        accessorFn: (row) => formatAddress(row),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ row }) => row.original.city ?? "—",
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ row }) => row.original.state ?? "—",
      },
      {
        accessorKey: "postalCode",
        header: "ZIP",
        cell: ({ row }) => row.original.postalCode ?? "—",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={<MapPin size={16} />}
          label="Total"
          value={summary.total}
          sublabel="locations"
          accent="sky"
        />
        <KpiCard
          icon={<CheckCircle2 size={16} />}
          label="Active"
          value={summary.active}
          sublabel="locations"
          accent="emerald"
        />
        <KpiCard
          icon={<Building2 size={16} />}
          label="Cities"
          value={summary.cityCount}
          sublabel="distinct"
          accent="violet"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v ?? "all") as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">City</Label>
          <Select
            value={cityFilter}
            onValueChange={(v) => setCityFilter((v ?? "all") as CityFilter)}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name…"
        rowHref={(l) => `/locations/${l.id}`}
        emptyMessage={
          hasActiveFilters
            ? "No locations match the current filters."
            : "No locations found."
        }
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel?: string;
  accent: "sky" | "emerald" | "violet";
}) {
  const wrap =
    accent === "sky"
      ? "ring-sky-200 bg-sky-50/40 text-sky-700"
      : accent === "emerald"
        ? "ring-emerald-200 bg-emerald-50/40 text-emerald-700"
        : "ring-violet-200 bg-violet-50/40 text-violet-700";
  return (
    <div
      className={cn("rounded-lg border bg-card p-4 ring-1 ring-inset", wrap)}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
        <span className="opacity-80">{icon}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {value.toLocaleString()}
        </span>
        {sublabel && (
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
