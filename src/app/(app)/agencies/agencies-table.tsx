"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { Agency, AgencyStatus } from "@/lib/types";

const STATUS_VARIANTS: Record<AgencyStatus, "default" | "secondary" | "outline"> =
  {
    active: "default",
    inactive: "secondary",
    pending: "outline",
  };

export function AgenciesTable({ data }: { data: Agency[] }) {
  const [statusFilter, setStatusFilter] = useState<AgencyStatus | "all">("all");

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? data
        : data.filter((a) => a.status === statusFilter),
    [data, statusFilter],
  );

  const columns = useMemo<ColumnDef<Agency>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "primaryLocation",
        header: "Location",
        cell: ({ row }) => row.original.primaryLocation ?? "—",
      },
      {
        accessorKey: "staffCount",
        header: "Staff",
        cell: ({ row }) => row.original.staffCount,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={STATUS_VARIANTS[row.original.status] ?? "secondary"}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
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
            onValueChange={(v) => setStatusFilter(v as AgencyStatus | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name…"
        rowHref={(agency) => `/agencies/${agency.id}`}
        emptyMessage="No agencies found."
      />
    </div>
  );
}
