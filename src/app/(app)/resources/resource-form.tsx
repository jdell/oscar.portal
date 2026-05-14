"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { MultiSelect } from "@/components/multi-select";
import type {
  PhoneNumberType,
  Resource,
  ResourceCategory,
} from "@/lib/types";
import { DEFAULT_STATE, US_STATES } from "@/lib/us-states";

const PHONE_TYPES: PhoneNumberType[] = [
  "mobile",
  "home",
  "work",
  "fax",
  "other",
];
const PHONE_REGEX = /^[+()\-\s\d.x]{7,}$/;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["medical", "healthy_living"]),
  primaryContact: z.string().optional(),
  emailAddress: z.string().min(1, "Email is required"),
  services: z.string().optional(),
  hours: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean(),
  acceptingNewClients: z.boolean().default(false),
  indigentCare: z.boolean().default(false),
  slidingFeeScale: z.boolean().default(false),
  interviewCheck: z.boolean().default(false),
  publicTransportation: z.boolean().default(false),
  bilingualStaff: z.boolean().default(false),
  address: z.object({
    address1: z.string().min(1, "Address line 1 is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(5, "ZIP must be at least 5 characters"),
  }),
  phoneNumbers: z.array(
    z.object({
      number: z
        .string()
        .optional()
        .refine(
          (v) => !v || PHONE_REGEX.test(v),
          "Enter a valid phone number",
        ),
      type: z.enum(PHONE_TYPES),
    }),
  ),
  resourceTypes: z.array(z.string()).default([]),
  insurers: z.array(z.string()).default([]),
  agencies: z.array(z.string()).default([]),
  reasons: z.array(z.string()).default([]),
  partnerTypes: z.array(z.string()).default([]),
  programTypes: z.array(z.string()).default([]),
  // legacy single-fields kept for compatibility
  npi: z.string().optional(),
  specialty: z.string().optional(),
  activityType: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface LookupOption {
  id: string;
  name: string;
}

interface ResourceFormProps {
  initial?: Partial<Resource> & {
    npi?: string;
    specialty?: string;
    activityType?: string;
  };
  resourceTypeOptions?: LookupOption[];
  insurerOptions?: LookupOption[];
  agencyOptions?: LookupOption[];
  reasonOptions?: LookupOption[];
  partnerTypeOptions?: LookupOption[];
  programTypeOptions?: LookupOption[];
}

export function ResourceForm({
  initial,
  resourceTypeOptions = [],
  insurerOptions = [],
  agencyOptions = [],
  reasonOptions = [],
  partnerTypeOptions = [],
  programTypeOptions = [],
}: ResourceFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const initialActive =
    initial?.active ?? initial?.isActive ?? true;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: initial?.name ?? "",
      category: (initial?.category as ResourceCategory) ?? "medical",
      primaryContact: initial?.primaryContact ?? "",
      emailAddress: initial?.emailAddress ?? initial?.email ?? "",
      services: initial?.services ?? "",
      hours: initial?.hours ?? "",
      url: initial?.url ?? initial?.website ?? "",
      notes: initial?.notes ?? "",
      description: initial?.description ?? "",
      active: initialActive,
      acceptingNewClients: initial?.acceptingNewClients ?? false,
      indigentCare: initial?.indigentCare ?? false,
      slidingFeeScale: initial?.slidingFeeScale ?? false,
      interviewCheck: initial?.interviewCheck ?? false,
      publicTransportation: initial?.publicTransportation ?? false,
      bilingualStaff: initial?.bilingualStaff ?? false,
      address: {
        address1:
          initial?.address?.address1 ?? initial?.address?.street ?? "",
        address2: initial?.address?.address2 ?? "",
        city: initial?.address?.city ?? "",
        state: initial?.address?.state ?? DEFAULT_STATE,
        zipCode: initial?.address?.zipCode ?? "",
      },
      phoneNumbers:
        initial?.phoneNumbers && initial.phoneNumbers.length > 0
          ? initial.phoneNumbers.map((p) => ({
              number: p.number,
              type: p.type,
            }))
          : [],
      resourceTypes: (initial?.resourceTypes as string[]) ?? [],
      insurers: (initial?.insurers as string[]) ?? [],
      agencies: (initial?.agencies as string[]) ?? [],
      reasons: (initial?.reasons as string[]) ?? [],
      partnerTypes: (initial?.partnerTypes as string[]) ?? [],
      programTypes: (initial?.programTypes as string[]) ?? [],
      npi: initial?.npi ?? "",
      specialty: initial?.specialty ?? "",
      activityType: initial?.activityType ?? "",
    },
  });

  const phones = useFieldArray({
    control: form.control,
    name: "phoneNumbers",
  });

  const category = form.watch("category");
  const isMedical = category === "medical";

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        address: {
          ...values.address,
          street: values.address.address1,
        },
        phoneNumbers: values.phoneNumbers.filter(
          (p) => p.number?.trim() && PHONE_REGEX.test(p.number),
        ),
        isActive: values.active,
      };

      const basePath = isMedical
        ? "/api/resources/medical"
        : "/api/resources/healthy-living";
      const url = isEdit ? `${basePath}/${initial?.id}` : basePath;
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
      const data = (await response.json()) as Resource;
      toast.success(isEdit ? "Resource updated" : "Resource created");
      if (isEdit) {
        router.push(`/resources/${data.id ?? initial?.id}`);
      } else {
        router.push("/resources");
      }
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Basic info</CardTitle>
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
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => {
                  if (v) form.setValue("category", v as ResourceCategory);
                }}
                disabled={isEdit}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="healthy_living">Healthy living</SelectItem>
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Category cannot be changed after creation.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryContact">Primary contact</Label>
              <Input
                id="primaryContact"
                {...form.register("primaryContact")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailAddress">Email *</Label>
              <Input
                id="emailAddress"
                {...form.register("emailAddress")}
              />
              {form.formState.errors.emailAddress && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.emailAddress.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
                id="active"
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="services">Services</Label>
            <textarea
              id="services"
              className="w-full rounded-lg border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={3}
              {...form.register("services")}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" {...form.register("hours")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Website / URL</Label>
              <Input
                id="url"
                placeholder="https://"
                {...form.register("url")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full rounded-lg border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={3}
              {...form.register("notes")}
            />
          </div>
          {isMedical ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input id="specialty" {...form.register("specialty")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npi">NPI</Label>
                <Input id="npi" {...form.register("npi")} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="activityType">Activity type</Label>
              <Input
                id="activityType"
                placeholder="e.g. Yoga, Nutrition class"
                {...form.register("activityType")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isMedical && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(
                [
                  ["acceptingNewClients", "Accepting new clients"],
                  ["indigentCare", "Indigent care"],
                  ["slidingFeeScale", "Sliding fee scale"],
                  ["interviewCheck", "Interview check"],
                  ["publicTransportation", "Near public transport"],
                  ["bilingualStaff", "Bilingual staff"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(form.watch(key))}
                    onCheckedChange={(v) => form.setValue(key, Boolean(v))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address1">Address line 1 *</Label>
              <Input id="address1" {...form.register("address.address1")} />
              {form.formState.errors.address?.address1 && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.address1.message}
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address2">Address line 2</Label>
              <Input id="address2" {...form.register("address.address2")} />
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
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} — {s.name}
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
              <Label htmlFor="zipCode">ZIP *</Label>
              <Input id="zipCode" {...form.register("address.zipCode")} />
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
              <div
                key={field.id}
                className="grid gap-2 md:grid-cols-[1fr_180px_auto]"
              >
                <div>
                  <Input
                    placeholder="Phone number"
                    {...form.register(
                      `phoneNumbers.${index}.number` as const,
                    )}
                  />
                  {form.formState.errors.phoneNumbers?.[index]?.number && (
                    <p className="mt-1 text-xs text-destructive">
                      {
                        form.formState.errors.phoneNumbers[index]?.number
                          ?.message
                      }
                    </p>
                  )}
                </div>
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
        <CardHeader>
          <CardTitle className="text-sm">Associations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Resource types</Label>
              <MultiSelect
                placeholder="Select types"
                options={resourceTypeOptions.map((r) => ({
                  value: r.id,
                  label: r.name,
                }))}
                value={form.watch("resourceTypes")}
                onChange={(v) => form.setValue("resourceTypes", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Agencies</Label>
              <MultiSelect
                placeholder="Select agencies"
                options={agencyOptions.map((a) => ({
                  value: a.id,
                  label: a.name,
                }))}
                value={form.watch("agencies")}
                onChange={(v) => form.setValue("agencies", v)}
              />
            </div>
            {isMedical && (
              <>
                <div className="space-y-2">
                  <Label>Insurances</Label>
                  <MultiSelect
                    placeholder="Select insurers"
                    options={insurerOptions.map((i) => ({
                      value: i.id,
                      label: i.name,
                    }))}
                    value={form.watch("insurers")}
                    onChange={(v) => form.setValue("insurers", v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referral reasons</Label>
                  <MultiSelect
                    placeholder="Select reasons"
                    options={reasonOptions.map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                    value={form.watch("reasons")}
                    onChange={(v) => form.setValue("reasons", v)}
                  />
                </div>
              </>
            )}
            {!isMedical && (
              <>
                <div className="space-y-2">
                  <Label>Partner types</Label>
                  <MultiSelect
                    placeholder="Select partner types"
                    options={partnerTypeOptions.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    value={form.watch("partnerTypes")}
                    onChange={(v) => form.setValue("partnerTypes", v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Program types</Label>
                  <MultiSelect
                    placeholder="Select program types"
                    options={programTypeOptions.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    value={form.watch("programTypes")}
                    onChange={(v) => form.setValue("programTypes", v)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

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
              : "Create resource"}
        </Button>
      </div>
    </form>
  );
}
