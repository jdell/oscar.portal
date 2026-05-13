"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatName } from "@/lib/utils";
import type { Provider } from "@/lib/types";

export function ProvidersTable({ data }: { data: Provider[] }) {
  const columns = useMemo<ColumnDef<Provider>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => formatName(row),
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{formatName(row.original)}</span>
        ),
      },
      { accessorKey: "specialty", header: "Specialty" },
      { accessorKey: "npi", header: "NPI" },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email ?? "—",
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
      rowHref={(p) => `/providers/${p.id}`}
      emptyMessage="No providers found."
    />
  );
}
