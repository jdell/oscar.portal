"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StaffMember, User } from "@/lib/types";
import { formatName } from "@/lib/utils";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  isAdmin: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CredentialsDialogProps {
  staff: StaffMember | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (user: User | null) => void;
}

function displayName(s: StaffMember): string {
  return s.name?.trim() || formatName(s);
}

export function CredentialsDialog({
  staff,
  onOpenChange,
  onSaved,
}: CredentialsDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const open = staff !== null;
  const existing = staff?.user ?? null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: existing?.username ?? "",
      isAdmin: existing?.isAdmin ?? false,
    },
  });

  useEffect(() => {
    form.reset({
      username: existing?.username ?? "",
      isAdmin: existing?.isAdmin ?? false,
    });
  }, [existing?.id, existing?.username, existing?.isAdmin, form]);

  if (!staff) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const url = existing
        ? `/api/users/${existing.id}`
        : "/api/users";
      const method = existing ? "PUT" : "POST";
      const payload = existing
        ? {
            id: existing.id,
            staffMemberId: staff.id,
            username: existing.username,
            isAdmin: values.isAdmin,
          }
        : {
            staffMemberId: staff.id,
            username: values.username,
            isAdmin: values.isAdmin,
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Save failed");
        return;
      }
      const data = (await res.json()) as User;
      onSaved(data);
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  async function onDelete() {
    if (!existing) return;
    if (
      !confirm(
        `Delete credentials for ${displayName(staff!)}? They will not be able to log in.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${existing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Delete failed");
        return;
      }
      onSaved(null);
    } catch {
      toast.error("Network error — try again");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {displayName(staff)} — Credentials
          </DialogTitle>
          <DialogDescription>
            {existing
              ? "Manage this user's login credentials."
              : "Create login credentials for this staff member."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              autoComplete="off"
              disabled={Boolean(existing)}
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">
                {form.formState.errors.username.message}
              </p>
            )}
            {existing && (
              <p className="text-xs text-muted-foreground">
                Username cannot be changed after creation.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAdmin"
              checked={form.watch("isAdmin")}
              onCheckedChange={(checked) =>
                form.setValue("isAdmin", Boolean(checked))
              }
            />
            <Label htmlFor="isAdmin" className="cursor-pointer">
              Grant admin privileges
            </Label>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {existing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={deleting || submitting}
                >
                  {deleting ? "Deleting…" : "Delete user"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || deleting}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {submitting ? "Saving…" : existing ? "Save changes" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
