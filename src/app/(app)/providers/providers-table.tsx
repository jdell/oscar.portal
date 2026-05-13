"use client";

import Link from "next/link";
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
      {
        accessorKey: "specialty",
        header: "Specialty",
        cell: ({ row }) => row.original.specialty ?? "—",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email ?? "—",
      },
      {
        accessorKey: "linkedResourceName",
        header: "Linked resource",
        cell: ({ row }) =>
          row.original.linkedResourceId && row.original.linkedResourceName ? (
            <Link
              href={`/resources/${row.original.linkedResourceId}`}
              className="text-sky-700 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.linkedResourceName}
            </Link>
          ) : (
            "—"
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
