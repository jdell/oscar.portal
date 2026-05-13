"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  Agency,
  PhoneNumberType,
  Role,
  StaffMember,
} from "@/lib/types";

const PHONE_TYPES: PhoneNumberType[] = ["mobile", "home", "work", "fax", "other"];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  emailAddress: z.string().email("Enter a valid email"),
  title: z.string().optional(),
  active: z.boolean(),
  isSurveyEnabled: z.boolean(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }),
  phoneNumbers: z.array(
    z.object({
      number: z.string().optional(),
      type: z.enum(PHONE_TYPES),
    }),
  ),
  supervisorId: z.string().optional(),
  medicalLiasonId: z.string().optional(),
  agencies: z.array(
    z.object({
      agencyId: z.string().min(1, "Pick an agency"),
      roleId: z.string().min(1, "Pick a role"),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

interface StaffFormProps {
  agencies: Agency[];
  roles: Role[];
  staffMembers: { id: string; name: string }[];
  initial?: Partial<StaffMember>;
}

export function StaffForm({
  agencies,
  roles,
  staffMembers,
  initial,
}: StaffFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isEdit = Boolean(initial?.id);

  const initialName =
    initial?.name ??
    [initial?.firstName, initial?.lastName].filter(Boolean).join(" ");
  const initialEmail = initial?.emailAddress ?? initial?.email ?? "";
  const initialActive = initial?.active ?? initial?.isActive ?? true;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName,
      emailAddress: initialEmail,
      title: initial?.title ?? "",
      active: initialActive,
      isSurveyEnabled: initial?.isSurveyEnabled ?? false,
      address: {
        street: initial?.address?.street ?? "",
        city: initial?.address?.city ?? "",
        state: initial?.address?.state ?? "",
        zipCode: initial?.address?.zipCode ?? "",
      },
      phoneNumbers:
        initial?.phoneNumbers && initial.phoneNumbers.length > 0
          ? initial.phoneNumbers.map((p) => ({ number: p.number, type: p.type }))
          : [],
      supervisorId: initial?.supervisorId ?? "",
      medicalLiasonId: initial?.medicalLiasonId ?? "",
      agencies:
        initial?.agencies && initial.agencies.length > 0
          ? initial.agencies.map((a) => ({
              agencyId: a.agencyId,
              roleId: a.roleId,
            }))
          : [],
    },
  });

  const phones = useFieldArray({ control: form.control, name: "phoneNumbers" });
  const agencyRoles = useFieldArray({
    control: form.control,
    name: "agencies",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        phoneNumbers: values.phoneNumbers.filter((p) => p.number?.trim()),
        supervisorId: values.supervisorId || null,
        medicalLiasonId: values.medicalLiasonId || null,
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

  async function forceSync() {
    if (!initial?.id) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/staff/${initial.id}/force-sync`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Force sync failed");
        return;
      }
      toast.success("Force sync queued");
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="emailAddress">Email *</Label>
              <Input
                id="emailAddress"
                type="email"
                {...form.register("emailAddress")}
              />
              {form.formState.errors.emailAddress && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.emailAddress.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                  id="active"
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isSurveyEnabled")}
                  onCheckedChange={(v) => form.setValue("isSurveyEnabled", v)}
                  id="isSurveyEnabled"
                />
                <Label htmlFor="isSurveyEnabled">Survey enabled</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Street</Label>
              <Input id="street" {...form.register("address.street")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("address.city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...form.register("address.state")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP</Label>
              <Input id="zipCode" {...form.register("address.zipCode")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Phone numbers</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => phones.append({ number: "", type: "mobile" })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add phone
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {phones.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No phone numbers.</p>
          ) : (
            phones.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                <Input
                  placeholder="Phone number"
                  {...form.register(`phoneNumbers.${index}.number` as const)}
                />
                <Select
                  value={form.watch(`phoneNumbers.${index}.type`)}
                  onValueChange={(v) => {
                    if (v)
                      form.setValue(
                        `phoneNumbers.${index}.type` as const,
                        v as PhoneNumberType,
                      );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => phones.remove(index)}
                  aria-label="Remove phone"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Agency assignments</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => agencyRoles.append({ agencyId: "", roleId: "" })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add assignment
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {agencyRoles.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agency assignments. Staff can belong to multiple agencies with
              different roles.
            </p>
          ) : (
            agencyRoles.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <Select
                  value={form.watch(`agencies.${index}.agencyId`)}
                  onValueChange={(v) => {
                    if (v)
                      form.setValue(`agencies.${index}.agencyId` as const, v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Agency" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={form.watch(`agencies.${index}.roleId`)}
                  onValueChange={(v) => {
                    if (v)
                      form.setValue(`agencies.${index}.roleId` as const, v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => agencyRoles.remove(index)}
                  aria-label="Remove assignment"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Supervisors</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="supervisorId">Supervisor</Label>
            <Select
              value={form.watch("supervisorId") || "__none__"}
              onValueChange={(v) =>
                form.setValue("supervisorId", !v || v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger id="supervisorId">
                <SelectValue placeholder="Select supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {staffMembers
                  .filter((s) => s.id !== initial?.id)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicalLiasonId">Medical liaison</Label>
            <Select
              value={form.watch("medicalLiasonId") || "__none__"}
              onValueChange={(v) =>
                form.setValue(
                  "medicalLiasonId",
                  !v || v === "__none__" ? "" : v,
                )
              }
            >
              <SelectTrigger id="medicalLiasonId">
                <SelectValue placeholder="Select liaison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {staffMembers
                  .filter((s) => s.id !== initial?.id)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <div>
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={forceSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing…" : "Force sync"}
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
            {submitting
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create staff member"}
          </Button>
        </div>
      </div>
    </form>
  );
}
