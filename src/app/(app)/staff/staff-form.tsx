"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agency, StaffMember } from "@/lib/types";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  title: z.string().optional(),
  agencyId: z.string().optional(),
  roles: z.string().optional(),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

interface StaffFormProps {
  agencies: Agency[];
  initial?: Partial<StaffMember>;
}

export function StaffForm({ agencies, initial }: StaffFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      title: initial?.title ?? "",
      agencyId: initial?.agencyId ?? "",
      roles: (initial?.roles ?? []).join(", "),
      isActive: initial?.isActive === false ? "false" : "true",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || null,
        title: values.title || null,
        agencyId: values.agencyId || null,
        roles: values.roles
          ? values.roles
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean)
          : [],
        isActive: values.isActive === "true",
      };

      const url = isEdit ? `/api/staff/${initial?.id}` : "/api/staff";
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
      const data = (await response.json()) as StaffMember;
      toast.success(isEdit ? "Staff updated" : "Staff member created");
      router.push(`/staff/${data.id ?? initial?.id}`);
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name *</Label>
              <Input id="firstName" {...form.register("firstName")} />
              {form.formState.errors.firstName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name *</Label>
              <Input id="lastName" {...form.register("lastName")} />
              {form.formState.errors.lastName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Community Health Worker"
                {...form.register("title")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyId">Agency</Label>
              <Select
                value={form.watch("agencyId") || "__none__"}
                onValueChange={(v) =>
                  form.setValue("agencyId", !v || v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger id="agencyId">
                  <SelectValue placeholder="Select an agency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No agency</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="roles">Roles</Label>
              <Input
                id="roles"
                placeholder="Comma-separated, e.g. chw, supervisor"
                {...form.register("roles")}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple roles with commas.
              </p>
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
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {submitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create staff member"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
