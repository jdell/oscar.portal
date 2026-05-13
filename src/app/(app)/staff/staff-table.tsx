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
import type { Agency, StaffMember } from "@/lib/types";

interface StaffTableProps {
  data: StaffMember[];
  agencies: Agency[];
}

export function StaffTable({ data, agencies }: StaffTableProps) {
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );

  const agencyName = useMemo(() => {
    const map = new Map<string, string>();
    agencies.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [agencies]);

  const filtered = useMemo(() => {
    return data.filter((s) => {
      if (agencyFilter !== "all" && s.agencyId !== agencyFilter) return false;
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;
      return true;
    });
  }, [data, agencyFilter, statusFilter]);

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
      },
      {
        id: "agency",
        accessorFn: (row) =>
          row.agencyName ?? (row.agencyId ? agencyName.get(row.agencyId) : null),
        header: "Agency",
        cell: ({ row }) => {
          const name =
            row.original.agencyName ??
            (row.original.agencyId
              ? agencyName.get(row.original.agencyId)
              : null);
          return name ?? "—";
        },
      },
      {
        accessorKey: "roles",
        header: "Role",
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.roles?.[0] ?? "—"}
          </span>
        ),
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
    [agencyName],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Agency</Label>
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agencies</SelectItem>
              {agencies.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
