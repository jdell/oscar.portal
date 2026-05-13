"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, initials } from "@/lib/utils";
import type { Provider } from "@/lib/types";
import {
  computeProviderSummary,
  specialtyKey,
  specialtyTagClasses,
  UNKNOWN_SPECIALTY_KEY,
} from "./provider-summary";

type StatusFilter = "all" | "active" | "inactive";
type SpecialtyFilter = "all" | string;

interface ProviderRow extends Provider {
  specialtyKey: string;
  specialtyLabel: string;
}

export function ProvidersTable({ data }: { data: Provider[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [specialtyFilter, setSpecialtyFilter] =
    useState<SpecialtyFilter>("all");

  const summary = useMemo(() => computeProviderSummary(data), [data]);

  const rows: ProviderRow[] = useMemo(
    () =>
      data.map((p) => ({
        ...p,
        specialtyKey: specialtyKey(p),
        specialtyLabel: p.participationType?.name?.trim() ?? "",
      })),
    [data],
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter === "active" && !row.active) return false;
      if (statusFilter === "inactive" && row.active) return false;
      if (specialtyFilter !== "all" && row.specialtyKey !== specialtyFilter)
        return false;
      return true;
    });
  }, [rows, statusFilter, specialtyFilter]);

  const columns = useMemo<ColumnDef<ProviderRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-semibold">
                {initials(row.original.name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate">{row.original.name}</div>
              {row.original.emailAddress && (
                <div className="text-xs text-muted-foreground truncate">
                  {row.original.emailAddress}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "specialtyLabel",
        header: "Specialty",
        cell: ({ row }) =>
          row.original.specialtyLabel ? (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                specialtyTagClasses(row.original.specialtyKey),
              )}
            >
              {row.original.specialtyLabel}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "emailAddress",
        header: "Email",
        cell: ({ row }) => row.original.emailAddress ?? "—",
      },
      {
        id: "medicalResource",
        header: "Medical resource",
        cell: ({ row }) => {
          const r = row.original.medicalResource;
          if (!r) return <span className="text-muted-foreground">—</span>;
          const city = r.address?.city;
          const state = r.address?.state;
          const sub =
            [city, state].filter(Boolean).join(", ") ||
            r.primaryContact ||
            "";
          return (
            <div className="flex items-start gap-2">
              <Building2 size={14} className="mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                {sub && (
                  <div className="text-xs text-muted-foreground truncate">
                    {sub}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.active ? "default" : "secondary"}>
            {row.original.active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total providers" value={summary.total} accent="violet" />
        <KpiCard label="Active" value={summary.active} accent="emerald" />
        <KpiCard label="Inactive" value={summary.inactive} accent="slate" />
      </div>

      {summary.bySpecialty.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            By specialty
          </span>
          {summary.bySpecialty.map((entry) => (
            <span
              key={entry.key}
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                specialtyTagClasses(entry.key),
              )}
            >
              {entry.label || "Unknown"} · {entry.count}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Specialty</Label>
          <Select
            value={specialtyFilter}
            onValueChange={(v) =>
              setSpecialtyFilter((v ?? "all") as SpecialtyFilter)
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              {summary.bySpecialty.map((entry) => (
                <SelectItem key={entry.key} value={entry.key}>
                  {entry.key === UNKNOWN_SPECIALTY_KEY
                    ? "Unknown"
                    : entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name…"
        rowHref={(p) => `/providers/${p.id}/edit`}
        emptyMessage="No providers found."
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "violet" | "emerald" | "slate";
}) {
  const ring =
    accent === "violet"
      ? "ring-violet-200 bg-violet-50/40"
      : accent === "emerald"
        ? "ring-emerald-200 bg-emerald-50/40"
        : "ring-slate-200 bg-slate-50/40";
  const dot =
    accent === "violet"
      ? "bg-violet-500"
      : accent === "emerald"
        ? "bg-emerald-500"
        : "bg-slate-400";
  return (
    <div className={cn("rounded-lg border bg-card p-4 ring-1 ring-inset", ring)}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
