"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@/lib/types";

function formatAddress(loc: Location): string {
  return (
    [loc.address1, loc.city, loc.state, loc.postalCode]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

export function LocationsTable({ data }: { data: Location[] }) {
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
      rowHref={(l) => `/locations/${l.id}`}
      emptyMessage="No locations found."
    />
  );
}
