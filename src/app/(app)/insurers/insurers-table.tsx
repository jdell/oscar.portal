"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Briefcase, Heart, IdCard, Plus, Shield } from "lucide-react";
import { DataTable } from "@/components/data-table";
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
import type { Insurer, InsurerType } from "@/lib/types";
import { INSURER_TYPES } from "@/lib/types";

const TYPE_LABEL: Record<InsurerType, string> = {
  medicare: "Medicare",
  medicaid: "Medicaid",
  private: "Private",
  other: "Other",
};

const TYPE_TAG_CLASS: Record<InsurerType, string> = {
  medicare: "bg-sky-100 text-sky-700 ring-sky-200",
  medicaid: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  private: "bg-amber-100 text-amber-700 ring-amber-200",
  other: "bg-slate-100 text-slate-700 ring-slate-200",
};

type TypeFilter = "all" | InsurerType;

export function InsurersTable({ data }: { data: Insurer[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const counts = useMemo(() => {
    const c: Record<InsurerType, number> = {
      medicare: 0,
      medicaid: 0,
      private: 0,
      other: 0,
    };
    for (const i of data) c[i.type ?? "other"]++;
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return data;
    return data.filter((i) => (i.type ?? "other") === typeFilter);
  }, [data, typeFilter]);

  const columns = useMemo<ColumnDef<Insurer>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.name} ${row.coverage ?? ""}`,
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const t = row.original.type ?? "other";
          return (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                TYPE_TAG_CLASS[t],
              )}
            >
              {TYPE_LABEL[t]}
            </span>
          );
        },
      },
      {
        accessorKey: "coverage",
        header: "Coverage",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.coverage || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Shield size={16} />}
          label="Total insurers"
          value={data.length}
          accent="indigo"
        />
        <KpiCard
          icon={<IdCard size={16} />}
          label="Medicare"
          value={counts.medicare}
          accent="sky"
        />
        <KpiCard
          icon={<Heart size={16} />}
          label="Medicaid"
          value={counts.medicaid}
          accent="emerald"
        />
        <KpiCard
          icon={<Briefcase size={16} />}
          label="Private"
          value={counts.private}
          accent="amber"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter((v ?? "all") as TypeFilter)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {INSURER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/insurers/new">
              <Plus className="mr-2 h-4 w-4" /> New insurer
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name or coverage…"
        rowHref={(i) => `/insurers/${i.id}`}
        emptyMessage={
          typeFilter !== "all"
            ? "No insurers match this filter."
            : "No insurers yet — add your first one."
        }
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "indigo" | "sky" | "emerald" | "amber";
}) {
  const wrap =
    accent === "indigo"
      ? "ring-indigo-200 bg-indigo-50/40 text-indigo-700"
      : accent === "sky"
        ? "ring-sky-200 bg-sky-50/40 text-sky-700"
        : accent === "emerald"
          ? "ring-emerald-200 bg-emerald-50/40 text-emerald-700"
          : "ring-amber-200 bg-amber-50/40 text-amber-700";
  return (
    <div
      className={cn("rounded-lg border bg-card p-4 ring-1 ring-inset", wrap)}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
        <span className="opacity-80">{icon}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
