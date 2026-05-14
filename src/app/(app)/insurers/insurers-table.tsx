"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Briefcase,
  Heart,
  IdCard,
  MoreVertical,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Insurer, InsurerType } from "@/lib/types";
import { INSURER_TYPES } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["medicare", "medicaid", "private", "other"]).nullable(),
  coverage: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_LABEL: Record<InsurerType, string> = {
  medicare: "Medicare",
  medicaid: "Medicaid",
  private: "Private",
  other: "Other",
};

const TYPE_TAG_CLASS: Record<InsurerType, string> = {
  medicare: "bg-sky-100 text-sky-700 ring-sky-200",
  medicaid: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  private: "bg-amber-100 text-amber-700 ring-amber-200",
  other: "bg-slate-100 text-slate-700 ring-slate-200",
};

type TypeFilter = "all" | InsurerType;

export function InsurersTable({ data }: { data: Insurer[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Insurer | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const counts = useMemo(() => {
    const c: Record<InsurerType, number> = {
      medicare: 0,
      medicaid: 0,
      private: 0,
      other: 0,
    };
    for (const i of data) c[i.type ?? "other"]++;
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return data;
    return data.filter((i) => (i.type ?? "other") === typeFilter);
  }, [data, typeFilter]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (insurer: Insurer) => {
    setEditing(insurer);
    setDialogOpen(true);
  };

  const handleDelete = async (insurer: Insurer) => {
    setDeletingId(insurer.id);
    try {
      const response = await fetch(`/api/insurers/${insurer.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.message ?? "Delete failed");
        return;
      }
      toast.success("Insurer deleted");
      setConfirmTarget(null);
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo<ColumnDef<Insurer>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.name} ${row.coverage ?? ""}`,
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const t = row.original.type ?? "other";
          return (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                TYPE_TAG_CLASS[t],
              )}
            >
              {TYPE_LABEL[t]}
            </span>
          );
        },
      },
      {
        accessorKey: "coverage",
        header: "Coverage",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.coverage || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const insurer = row.original;
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
                      openEdit(insurer);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmTarget(insurer);
                    }}
                    disabled={deletingId === insurer.id}
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
    [deletingId],
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Shield size={16} />}
          label="Total insurers"
          value={data.length}
          accent="indigo"
        />
        <KpiCard
          icon={<IdCard size={16} />}
          label="Medicare"
          value={counts.medicare}
          accent="sky"
        />
        <KpiCard
          icon={<Heart size={16} />}
          label="Medicaid"
          value={counts.medicaid}
          accent="emerald"
        />
        <KpiCard
          icon={<Briefcase size={16} />}
          label="Private"
          value={counts.private}
          accent="amber"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter((v ?? "all") as TypeFilter)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {INSURER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button onClick={openNew} className="bg-sky-600 hover:bg-sky-700">
            <Plus className="mr-2 h-4 w-4" /> New insurer
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name or coverage…"
        emptyMessage={
          typeFilter !== "all"
            ? "No insurers match this filter."
            : "No insurers yet — add your first one."
        }
      />

      <InsurerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete insurer?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{confirmTarget?.name}&rdquo;.
              This cannot be undone.
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

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "indigo" | "sky" | "emerald" | "amber";
}) {
  const wrap =
    accent === "indigo"
      ? "ring-indigo-200 bg-indigo-50/40 text-indigo-700"
      : accent === "sky"
        ? "ring-sky-200 bg-sky-50/40 text-sky-700"
        : accent === "emerald"
          ? "ring-emerald-200 bg-emerald-50/40 text-emerald-700"
          : "ring-amber-200 bg-amber-50/40 text-amber-700";
  return (
    <div
      className={cn("rounded-lg border bg-card p-4 ring-1 ring-inset", wrap)}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
        <span className="opacity-80">{icon}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function InsurerDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Insurer | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(editing);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: editing?.name ?? "",
      type: editing?.type ?? null,
      coverage: editing?.coverage ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        id: editing?.id,
        name: values.name,
        type: values.type,
        coverage: values.coverage || null,
      };
      const url = isEdit ? `/api/insurers/${editing?.id}` : "/api/insurers";
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.message ?? "Save failed");
        return;
      }
      toast.success(
        isEdit ? `Insurer ${values.name} saved` : "Insurer created",
      );
      onSaved();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${editing?.name}` : "New insurer"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this insurer's information."
              : "Add a new insurance provider to your organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.watch("type") ?? "__none__"}
              onValueChange={(v) => {
                if (v === "__none__") {
                  form.setValue("type", null);
                } else if (v) {
                  form.setValue("type", v as InsurerType);
                }
              }}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unspecified</SelectItem>
                {INSURER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverage">Coverage</Label>
            <textarea
              id="coverage"
              rows={4}
              className="w-full rounded-md border bg-background p-2 text-sm"
              placeholder="Describe what this insurer covers…"
              {...form.register("coverage")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

