"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
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
import type { Insurer, InsurerType } from "@/lib/types";

const TYPE_LABELS: Record<InsurerType, string> = {
  medicare: "Medicare",
  medicaid: "Medicaid",
  private: "Private",
};

const TYPE_BADGE: Record<InsurerType, string> = {
  medicare: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  medicaid: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  private: "bg-slate-100 text-slate-800 hover:bg-slate-100",
};

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  type: z.enum(["medicare", "medicaid", "private"]),
  phone: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function InsurersTable({ data }: { data: Insurer[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      shortName: "",
      type: "private",
      phone: "",
      isActive: true,
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      shortName: "",
      type: "private",
      phone: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (insurer: Insurer) => {
    setEditing(insurer);
    form.reset({
      name: insurer.name,
      shortName: insurer.shortName ?? "",
      type: insurer.type ?? "private",
      phone: insurer.phone ?? "",
      isActive: insurer.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        shortName: values.shortName || null,
        type: values.type,
        phone: values.phone || null,
        isActive: values.isActive,
      };
      const url = editing ? `/api/insurers/${editing.id}` : "/api/insurers";
      const method = editing ? "PUT" : "POST";
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
      toast.success(editing ? "Insurer updated" : "Insurer created");
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = async (insurer: Insurer) => {
    if (!confirm(`Delete insurer "${insurer.name}"? This cannot be undone.`)) {
      return;
    }
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
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    }
  };

  const columns = useMemo<ColumnDef<Insurer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "shortName",
        header: "Short name",
        cell: ({ row }) => row.original.shortName ?? "—",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const t = row.original.type;
          if (!t) return "—";
          return <Badge className={TYPE_BADGE[t]}>{TYPE_LABELS[t]}</Badge>;
        },
      },
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Actions" />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDelete(row.original)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-sky-600 hover:bg-sky-700">
          <Plus className="mr-2 h-4 w-4" /> New insurer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search by name…"
        emptyMessage="No insurers found."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit insurer" : "New insurer"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update insurer details."
                : "Add an insurance provider."}
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
              <Label htmlFor="shortName">Short name</Label>
              <Input id="shortName" {...form.register("shortName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as InsurerType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="medicaid">Medicaid</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4 rounded border"
                checked={form.watch("isActive")}
                onChange={(e) => form.setValue("isActive", e.target.checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {submitting ? "Saving…" : editing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
