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
import type { Provider, Resource } from "@/lib/types";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  specialty: z.string().optional(),
  npi: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedResourceId: z.string().optional(),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

interface ProviderFormProps {
  resources: Resource[];
  initial?: Partial<Provider>;
}

export function ProviderForm({ resources, initial }: ProviderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      specialty: initial?.specialty ?? "",
      npi: initial?.npi ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      linkedResourceId: initial?.linkedResourceId ?? "",
      isActive: initial?.isActive === false ? "false" : "true",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        specialty: values.specialty || null,
        npi: values.npi || null,
        email: values.email || null,
        phone: values.phone || null,
        linkedResourceId: values.linkedResourceId || null,
        isActive: values.isActive === "true",
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
      const data = (await response.json()) as Provider;
      toast.success(isEdit ? "Provider updated" : "Provider created");
      router.push(`/providers/${data.id ?? initial?.id}`);
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
              <Label htmlFor="specialty">Specialty</Label>
              <Input id="specialty" {...form.register("specialty")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="npi">NPI</Label>
              <Input id="npi" {...form.register("npi")} />
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
              <Label htmlFor="linkedResourceId">Linked resource</Label>
              <Select
                value={form.watch("linkedResourceId") || "__none__"}
                onValueChange={(v) =>
                  form.setValue(
                    "linkedResourceId",
                    !v || v === "__none__" ? "" : v,
                  )
                }
              >
                <SelectTrigger id="linkedResourceId">
                  <SelectValue placeholder="Select a resource (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No linked resource</SelectItem>
                  {resources.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  : "Create provider"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
