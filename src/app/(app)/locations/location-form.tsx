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
import { Switch } from "@/components/ui/switch";
import type { Location } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address1: z.string().min(1, "Street is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z
    .string()
    .min(5, "ZIP must be at least 5 characters")
    .max(10, "ZIP is too long"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface LocationFormProps {
  initial?: Partial<Location>;
}

export function LocationForm({ initial }: LocationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      address1: initial?.address1 ?? "",
      address2: initial?.address2 ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "",
      postalCode: initial?.postalCode ?? "",
      isActive: initial?.isActive ?? true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/locations/${initial?.id}` : "/api/locations";
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.message ?? "Save failed");
        return;
      }
      const data = (await response.json()) as Location;
      toast.success(isEdit ? "Location updated" : "Location created");
      router.push(`/locations/${data.id ?? initial?.id}`);
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
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={2}
                className="w-full rounded-md border bg-background p-2 text-sm"
                {...form.register("description")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address1">Street *</Label>
              <Input id="address1" {...form.register("address1")} />
              {form.formState.errors.address1 && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address1.message}
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address2">Address line 2</Label>
              <Input id="address2" {...form.register("address2")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...form.register("city")} />
              {form.formState.errors.city && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" {...form.register("state")} />
              {form.formState.errors.state && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.state.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">ZIP *</Label>
              <Input id="postalCode" {...form.register("postalCode")} />
              {form.formState.errors.postalCode && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.postalCode.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2 md:mt-7">
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create location"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
