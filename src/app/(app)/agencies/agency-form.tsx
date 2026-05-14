"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/multi-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Agency } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
  active: z.boolean(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  directorId: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(5, "ZIP must be at least 5 characters"),
  }),
  counties: z.array(z.string()).default([]),
  insurers: z.array(z.string()).default([]),
  healthyLivingResources: z.array(z.string()).default([]),
  medicalResources: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

export interface LookupOption {
  id: string;
  name: string;
}

interface AgencyFormProps {
  initial?: Partial<Agency> & {
    email?: string | null;
    phone?: string | null;
    website?: string | null;
  };
  staff?: LookupOption[];
  states?: string[];
  counties?: LookupOption[];
  insurers?: LookupOption[];
  healthyLivingResources?: LookupOption[];
  medicalResources?: LookupOption[];
  permissions?: LookupOption[];
}

const DEFAULT_STATE = "AL";

export function AgencyForm({
  initial,
  staff = [],
  states = [],
  counties = [],
  insurers = [],
  healthyLivingResources = [],
  medicalResources = [],
  permissions = [],
}: AgencyFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = Boolean(initial?.id);

  const initialActive =
    initial?.active ?? (initial?.status ? initial.status === "active" : true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: initial?.name ?? "",
      shortName: initial?.shortName ?? "",
      status: (initial?.status as FormValues["status"]) ?? "active",
      active: initialActive,
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      website: initial?.website ?? "",
      directorId: initial?.directorId ?? "",
      address: {
        street: initial?.address?.street ?? "",
        city: initial?.address?.city ?? "",
        state: initial?.address?.state ?? DEFAULT_STATE,
        zipCode: initial?.address?.zipCode ?? "",
      },
      counties: (initial?.counties as string[]) ?? [],
      insurers: (initial?.insurers as string[]) ?? [],
      healthyLivingResources:
        (initial?.healthyLivingResources as string[]) ?? [],
      medicalResources: (initial?.medicalResources as string[]) ?? [],
      permissions: (initial?.permissions as string[]) ?? [],
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const status: FormValues["status"] = values.active
        ? "active"
        : "inactive";
      const payload = {
        ...values,
        status,
        directorId: values.directorId || null,
        email: values.email || null,
        phone: values.phone || null,
        website: values.website || null,
        shortName: values.shortName || null,
      };
      const url = isEdit ? `/api/agencies/${initial?.id}` : "/api/agencies";
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
      const data = (await response.json()) as Agency;
      toast.success(isEdit ? "Agency updated" : "Agency created");
      router.push(`/agencies/${data.id ?? initial?.id}`);
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = async () => {
    if (!initial?.id) return;
    const response = await fetch(`/api/agencies/${initial.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.message ?? "Delete failed");
      return;
    }
    toast.success("Agency deleted");
    router.push("/agencies");
    router.refresh();
  };

  const stateOptions =
    states.length > 0 ? states : [DEFAULT_STATE];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
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
              <Label htmlFor="director">Executive Director</Label>
              <Select
                value={form.watch("directorId") || ""}
                onValueChange={(v) =>
                  form.setValue("directorId", (v as string) ?? "")
                }
              >
                <SelectTrigger id="director" className="w-full">
                  <SelectValue placeholder="Select director" />
                </SelectTrigger>
                <SelectContent>
                  {staff.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No staff available
                    </SelectItem>
                  ) : (
                    staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://"
                {...form.register("website")}
              />
              {form.formState.errors.website && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.website.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(checked) =>
                  form.setValue("active", Boolean(checked))
                }
              />
              <Label className="text-sm">
                {form.watch("active") ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Street *</Label>
              <Input id="street" {...form.register("address.street")} />
              {form.formState.errors.address?.street && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.street.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...form.register("address.city")} />
              {form.formState.errors.address?.city && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={form.watch("address.state") || ""}
                onValueChange={(v) =>
                  form.setValue("address.state", (v as string) ?? "")
                }
              >
                <SelectTrigger id="state" className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {stateOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.address?.state && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.state.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP code *</Label>
              <Input id="zip" {...form.register("address.zipCode")} />
              {form.formState.errors.address?.zipCode && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.zipCode.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Associations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Counties</Label>
              <MultiSelect
                placeholder="Select counties"
                options={counties.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={form.watch("counties")}
                onChange={(v) => form.setValue("counties", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Insurers</Label>
              <MultiSelect
                placeholder="Select insurers"
                options={insurers.map((i) => ({
                  value: i.id,
                  label: i.name,
                }))}
                value={form.watch("insurers")}
                onChange={(v) => form.setValue("insurers", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Healthy living resources</Label>
              <MultiSelect
                placeholder="Select healthy living resources"
                options={healthyLivingResources.map((r) => ({
                  value: r.id,
                  label: r.name,
                }))}
                value={form.watch("healthyLivingResources")}
                onChange={(v) => form.setValue("healthyLivingResources", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Medical resources</Label>
              <MultiSelect
                placeholder="Select medical resources"
                options={medicalResources.map((r) => ({
                  value: r.id,
                  label: r.name,
                }))}
                value={form.watch("medicalResources")}
                onChange={(v) => form.setValue("medicalResources", v)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Permissions</Label>
              <MultiSelect
                placeholder="Select permissions"
                options={permissions.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                value={form.watch("permissions")}
                onChange={(v) => form.setValue("permissions", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div>
          {isEdit && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={submitting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete agency
            </Button>
          )}
        </div>
        <div className="flex gap-2">
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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create agency"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete agency?"
        description={`This will permanently delete "${initial?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </form>
  );
}
