"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Insurer } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

export function InsurersTable({ data }: { data: Insurer[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (insurer: Insurer) => {
    setEditing(insurer);
    setDialogOpen(true);
  };

  const handleDelete = async (insurer: Insurer) => {
    if (!confirm(`Delete insurer "${insurer.name}"? This cannot be undone.`)) {
      return;
    }
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
                      handleDelete(insurer);
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
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew} className="bg-sky-600 hover:bg-sky-700">
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
      <InsurerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </>
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
      shortName: editing?.shortName ?? "",
      phone: editing?.phone ?? "",
      isActive: editing?.isActive === false ? "false" : "true",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        shortName: values.shortName || null,
        phone: values.phone || null,
        isActive: values.isActive === "true",
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
      toast.success(isEdit ? "Insurer updated" : "Insurer created");
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
            <Label htmlFor="shortName">Short name</Label>
            <Input id="shortName" {...form.register("shortName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <Select
              value={form.watch("isActive")}
              onValueChange={(v) => {
                if (v) form.setValue("isActive", v as FormValues["isActive"]);
              }}
            >
              <SelectTrigger id="isActive">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
