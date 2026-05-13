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

const CATEGORY_BADGE: Record<ResourceCategory, "default" | "secondary"> = {
  medical: "default",
  healthy_living: "secondary",
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
          <Badge variant={CATEGORY_BADGE[row.original.category]}>
            {CATEGORY_LABELS[row.original.category]}
          </Badge>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => row.original.location ?? "—",
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
    <div className="space-y-4">
      <div className="flex items-end gap-3">
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
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name…"
        rowHref={(r) => `/resources/${r.id}`}
        emptyMessage="No resources found."
      />
    </div>
  );
}
