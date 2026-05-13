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
import type { Resource, ResourceCategory } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["medical", "healthy_living"]),
  resourceTypeName: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  npi: z.string().optional(),
  specialty: z.string().optional(),
  activityType: z.string().optional(),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

interface ResourceFormProps {
  initial?: Partial<Resource> & {
    npi?: string;
    specialty?: string;
    activityType?: string;
  };
}

export function ResourceForm({ initial }: ResourceFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      category: (initial?.category as ResourceCategory) ?? "medical",
      resourceTypeName: initial?.resourceTypeName ?? "",
      description: initial?.description ?? "",
      location: initial?.location ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      website: initial?.website ?? "",
      npi: initial?.npi ?? "",
      specialty: initial?.specialty ?? "",
      activityType: initial?.activityType ?? "",
      isActive: initial?.isActive === false ? "false" : "true",
    },
  });

  const category = form.watch("category");

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const isMedical = values.category === "medical";
      const payload = {
        name: values.name,
        resourceTypeName: values.resourceTypeName || null,
        description: values.description || null,
        location: values.location || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        ...(isMedical
          ? { npi: values.npi || null, specialty: values.specialty || null }
          : { activityType: values.activityType || null }),
        isActive: values.isActive === "true",
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
      router.push(`/resources/${data.id ?? initial?.id}`);
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
              <Label htmlFor="resourceTypeName">Type</Label>
              <Input
                id="resourceTypeName"
                placeholder={
                  category === "medical" ? "e.g. Clinic, Pharmacy" : "e.g. Gym, Class"
                }
                {...form.register("resourceTypeName")}
              />
            </div>

            {category === "medical" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input id="specialty" {...form.register("specialty")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="npi">NPI</Label>
                  <Input id="npi" {...form.register("npi")} />
                </div>
              </>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="activityType">Activity type</Label>
                <Input
                  id="activityType"
                  placeholder="e.g. Yoga, Nutrition class"
                  {...form.register("activityType")}
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. 123 Main St, City"
                {...form.register("location")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...form.register("description")} />
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
                  : "Create resource"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
