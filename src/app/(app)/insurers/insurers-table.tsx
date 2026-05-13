"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Insurer } from "@/lib/types";

export function InsurersTable({ data }: { data: Insurer[] }) {
  const columns = useMemo<ColumnDef<Insurer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      { accessorKey: "shortName", header: "Short name" },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone ?? "—",
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
      emptyMessage="No insurers found."
    />
  );
}
