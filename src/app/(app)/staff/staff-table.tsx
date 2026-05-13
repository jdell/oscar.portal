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
import { formatName } from "@/lib/utils";
import type { StaffMember } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";

export function StaffTable({ data }: { data: StaffMember[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return data;
    const wantActive = statusFilter === "active";
    return data.filter((s) => s.isActive === wantActive);
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<StaffMember>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => formatName(row),
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{formatName(row.original)}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email,
      },
      {
        accessorKey: "agencyName",
        header: "Agency",
        cell: ({ row }) => row.original.agencyName ?? "—",
      },
      {
        accessorKey: "roles",
        header: "Role",
        cell: ({ row }) => row.original.roles.join(", ") || "—",
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
            onValueChange={(v) => {
              if (v) setStatusFilter(v as StatusFilter);
            }}
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
        rowHref={(s) => `/staff/${s.id}`}
        emptyMessage="No staff members found."
      />
    </div>
  );
}
