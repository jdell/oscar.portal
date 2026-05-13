"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import type {
  MedicalResourceSummary,
  Provider,
  ProviderParticipationType,
} from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  emailAddress: z.string().email("Invalid email").optional().or(z.literal("")),
  providerParticipationTypeId: z.coerce
    .number()
    .int()
    .positive("Participation type is required"),
  medicalResourceId: z.coerce
    .number()
    .int()
    .positive("Medical resource is required"),
  active: z.boolean(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface ProviderFormProps {
  participationTypes: ProviderParticipationType[];
  medicalResources: MedicalResourceSummary[];
  initial?: Partial<Provider>;
}

export function ProviderForm({
  participationTypes,
  medicalResources,
  initial,
}: ProviderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      emailAddress: initial?.emailAddress ?? "",
      providerParticipationTypeId: initial?.providerParticipationTypeId ?? 0,
      medicalResourceId: initial?.medicalResourceId ?? 0,
      active: initial?.active ?? true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        id: initial?.id,
        name: values.name,
        emailAddress: values.emailAddress || null,
        providerParticipationTypeId: values.providerParticipationTypeId,
        medicalResourceId: values.medicalResourceId,
        active: values.active,
      };

      const url = isEdit ? `/api/providers/${initial?.id}` : "/api/providers";
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
        isEdit ? `Provider ${values.name} saved` : "Provider created",
      );
      router.push("/providers");
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  async function onDelete() {
    if (!initial?.id) return;
    if (!confirm(`Delete provider "${initial.name}"? This cannot be undone.`))
      return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/providers/${initial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Delete failed");
        return;
      }
      toast.success("Provider deleted");
      router.push("/providers");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const ptId = form.watch("providerParticipationTypeId");
  const mrId = form.watch("medicalResourceId");

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emailAddress">Email address</Label>
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
              <Label htmlFor="providerParticipationTypeId">
                Participation type *
              </Label>
              <Select
                value={ptId ? String(ptId) : ""}
                onValueChange={(v) =>
                  form.setValue(
                    "providerParticipationTypeId",
                    Number(v ?? 0),
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="providerParticipationTypeId">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {participationTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.providerParticipationTypeId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.providerParticipationTypeId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicalResourceId">Medical resource *</Label>
              <Select
                value={mrId ? String(mrId) : ""}
                onValueChange={(v) =>
                  form.setValue("medicalResourceId", Number(v ?? 0), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="medicalResourceId">
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {medicalResources.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.medicalResourceId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.medicalResourceId.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
              <Label htmlFor="active" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="active"
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={submitting}
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                    : "Create provider"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
