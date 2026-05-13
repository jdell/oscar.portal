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
import type { Location } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";

function formatAddress(loc: Location): string {
  return (
    [loc.address1, loc.address2].filter(Boolean).join(", ") || "—"
  );
}

export function LocationsTable({ data }: { data: Location[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return data;
    const wantActive = statusFilter === "active";
    return data.filter((l) => l.isActive === wantActive);
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<Location>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
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
        rowHref={(l) => `/locations/${l.id}`}
        emptyMessage="No locations found."
      />
    </div>
  );
}
