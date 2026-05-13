"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatName } from "@/lib/utils";
import type { StaffMember } from "@/lib/types";

export function StaffTable({ data }: { data: StaffMember[] }) {
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
      { accessorKey: "title", header: "Title" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "roles",
        header: "Roles",
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
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search by name…"
      rowHref={(s) => `/staff/${s.id}`}
      emptyMessage="No staff members found."
    />
  );
}
