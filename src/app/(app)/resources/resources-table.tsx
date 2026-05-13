"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Resource, ResourceCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  medical: "Medical",
  healthy_living: "Healthy living",
};

const CATEGORY_BADGE: Record<ResourceCategory, string> = {
  medical: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  healthy_living: "bg-green-100 text-green-800 hover:bg-green-100",
};

export function ResourcesTable({ data }: { data: Resource[] }) {
  const [category, setCategory] = useState<ResourceCategory | "all">("all");

  const filtered = useMemo(
    () =>
      category === "all" ? data : data.filter((r) => r.category === category),
    [data, category],
  );

  const columns = useMemo<ColumnDef<Resource>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge className={CATEGORY_BADGE[row.original.category]}>
            {CATEGORY_LABELS[row.original.category]}
          </Badge>
        ),
      },
      {
        id: "location",
        accessorFn: (row) =>
          row.locationName ?? [row.city, row.state].filter(Boolean).join(", "),
        header: "Location",
        cell: ({ row }) => {
          const loc =
            row.original.locationName ??
            [row.original.city, row.original.state].filter(Boolean).join(", ");
          return loc || "—";
        },
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
      {
        accessorKey: "acceptingPatients",
        header: "Accepting",
        cell: ({ row }) => {
          const accepting = row.original.acceptingPatients;
          if (accepting === null || accepting === undefined) return "—";
          return (
            <Badge variant={accepting ? "default" : "outline"}>
              {accepting ? "Yes" : "No"}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as ResourceCategory | "all")}
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
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name…"
        rowHref={(r) => `/resources/${r.id}?category=${r.category}`}
        emptyMessage="No resources found."
      />
    </div>
  );
}
