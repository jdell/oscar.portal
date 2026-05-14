"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { MultiSelect } from "@/components/multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDate } from "@/lib/utils";
import type {
  Agency,
  AgencyFilterOptions,
  AgencyStatus,
} from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";

function isActive(agency: Agency): boolean {
  return agency.active ?? agency.status === "active";
}

function formatAddress(agency: Agency): string {
  const a = agency.address;
  if (a?.street || a?.city || a?.state || a?.zipCode) {
    const cityState = [a?.state, a?.zipCode].filter(Boolean).join(" ");
    return [a?.street, a?.city, cityState].filter(Boolean).join(", ");
  }
  return agency.primaryLocation ?? "—";
}

const STATUS_VARIANTS: Record<AgencyStatus, "default" | "secondary" | "outline"> =
  {
    active: "default",
    inactive: "secondary",
    pending: "outline",
  };

interface AgenciesTableProps {
  data: Agency[];
  filterOptions: AgencyFilterOptions;
}

export function AgenciesTable({ data, filterOptions }: AgenciesTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [countyFilter, setCountyFilter] = useState<string[]>([]);
  const [insurerFilter, setInsurerFilter] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Agency | null>(null);

  const filtered = useMemo(() => {
    return data.filter((a) => {
      if (statusFilter !== "all") {
        const wantActive = statusFilter === "active";
        if (isActive(a) !== wantActive) return false;
      }
      if (stateFilter.length > 0) {
        const st = a.address?.state ?? null;
        if (!st || !stateFilter.includes(st)) return false;
      }
      if (countyFilter.length > 0) {
        const cs = a.counties ?? [];
        if (!cs.some((c) => countyFilter.includes(c))) return false;
      }
      if (insurerFilter.length > 0) {
        const ins = a.insurers ?? [];
        if (!ins.some((i) => insurerFilter.includes(i))) return false;
      }
      return true;
    });
  }, [data, statusFilter, stateFilter, countyFilter, insurerFilter]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    stateFilter.length > 0 ||
    countyFilter.length > 0 ||
    insurerFilter.length > 0;

  const clearFilters = () => {
    setStatusFilter("all");
    setStateFilter([]);
    setCountyFilter([]);
    setInsurerFilter([]);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const response = await fetch(`/api/agencies/${pendingDelete.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.message ?? "Delete failed");
      return;
    }
    toast.success("Agency deleted");
    router.refresh();
  };

  const columns = useMemo<ColumnDef<Agency>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isActive(row.original) ? "bg-emerald-500" : "bg-slate-300"
              }`}
              aria-hidden="true"
            />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "address",
        accessorFn: (row) => formatAddress(row),
        header: "Address",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatAddress(row.original)}
          </span>
        ),
      },
      {
        id: "state",
        accessorFn: (row) => row.address?.state ?? "",
        header: "State",
        cell: ({ row }) => row.original.address?.state ?? "—",
      },
      {
        id: "counties",
        header: "Counties",
        cell: ({ row }) => {
          const n = row.original.counties?.length ?? 0;
          return n > 0 ? (
            <Badge variant="secondary">{n}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "insurers",
        header: "Insurers",
        cell: ({ row }) => {
          const n = row.original.insurers?.length ?? 0;
          return n > 0 ? (
            <Badge variant="secondary">{n}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const a = row.original;
          const variant =
            STATUS_VARIANTS[a.status] ??
            (isActive(a) ? "default" : "secondary");
          return (
            <Badge variant={variant} className="capitalize">
              {isActive(a) ? "Active" : "Inactive"}
            </Badge>
          );
        },
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const agency = row.original;
          return (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex justify-end"
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/agencies/${agency.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/agencies/${agency.id}/edit`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setPendingDelete(agency)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
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
        <div className="space-y-1">
          <Label className="text-xs">State</Label>
          <MultiSelect
            placeholder="Any state"
            options={filterOptions.states.map((s) => ({ value: s, label: s }))}
            value={stateFilter}
            onChange={setStateFilter}
            className="w-44"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Counties</Label>
          <MultiSelect
            placeholder="Any county"
            options={filterOptions.counties.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={countyFilter}
            onChange={setCountyFilter}
            className="w-52"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Insurers</Label>
          <MultiSelect
            placeholder="Any insurer"
            options={filterOptions.insurers.map((i) => ({
              value: i.id,
              label: i.name,
            }))}
            value={insurerFilter}
            onChange={setInsurerFilter}
            className="w-52"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name…"
        rowHref={(agency) => `/agencies/${agency.id}`}
        emptyMessage={
          hasActiveFilters
            ? "No agencies match these filters."
            : "No agencies yet."
        }
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete agency?"
        description={
          pendingDelete
            ? `This will permanently delete "${pendingDelete.name}". This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
