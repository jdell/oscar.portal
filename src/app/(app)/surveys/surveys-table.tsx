"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { CheckCircle2, MoreVertical, Pencil, Trash2, XCircle } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { Survey } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";

export function SurveysTable({ data }: { data: Survey[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [confirmTarget, setConfirmTarget] = useState<Survey | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return data;
    const wantActive = statusFilter === "active";
    return data.filter((s) => Boolean(s.active) === wantActive);
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    const active = data.filter((s) => s.active).length;
    return { total: data.length, active, inactive: data.length - active };
  }, [data]);

  async function handleDelete(survey: Survey) {
    setDeletingId(survey.id);
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Delete failed");
        return;
      }
      toast.success("Survey deleted");
      setConfirmTarget(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const columns = useMemo<ColumnDef<Survey>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "questionCount",
        header: "Questions",
        accessorFn: (s) => s.questions?.length ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.questions?.length ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "active",
        header: "Active",
        cell: ({ row }) =>
          row.original.active ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Actions"
                  render={
                    <Button variant="ghost" size="icon" className="h-7 w-7" />
                  }
                >
                  <MoreVertical size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/surveys/${s.id}`);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmTarget(s);
                    }}
                    disabled={deletingId === s.id}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deletingId, router],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total surveys" value={stats.total} />
        <SummaryCard label="Active" value={stats.active} accent="emerald" />
        <SummaryCard label="Inactive" value={stats.inactive} accent="slate" />
      </div>

      <div className="flex flex-wrap items-end gap-3">
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
        searchPlaceholder="Search by name or description…"
        rowHref={(s) => `/surveys/${s.id}`}
        emptyMessage="No surveys yet — create your first one."
      />

      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete survey?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{confirmTarget?.name}&rdquo;
              and all its questions and answers. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletingId !== null}
              onClick={() => confirmTarget && handleDelete(confirmTarget)}
            >
              {deletingId !== null ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "slate";
}) {
  const ring =
    accent === "emerald"
      ? "ring-emerald-200 bg-emerald-50/40"
      : accent === "slate"
        ? "ring-slate-200 bg-slate-50/40"
        : "ring-sky-200 bg-sky-50/40";
  return (
    <div className={`rounded-lg border bg-card p-4 ring-1 ring-inset ${ring}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
