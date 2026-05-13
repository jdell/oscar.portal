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
  category: z.enum(["medical", "healthy_living"]),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  services: z.string().optional(),
  hours: z.string().optional(),
  isActive: z.boolean(),
  acceptingPatients: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ResourceFormProps {
  initial?: Partial<Resource>;
}

export function ResourceForm({ initial }: ResourceFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: (initial?.category as ResourceCategory) ?? "medical",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      website: initial?.website ?? "",
      address1: initial?.address1 ?? "",
      address2: initial?.address2 ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "",
      postalCode: initial?.postalCode ?? "",
      services: initial?.services ?? "",
      hours: initial?.hours ?? "",
      isActive: initial?.isActive ?? true,
      acceptingPatients: initial?.acceptingPatients ?? false,
    },
  });

  const category = form.watch("category");

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        description: values.description || null,
        email: values.email || null,
        phone: values.phone || null,
        website: values.website || null,
        address1: values.address1 || null,
        address2: values.address2 || null,
        city: values.city || null,
        state: values.state || null,
        postalCode: values.postalCode || null,
        services: values.services || null,
        hours: values.hours || null,
        isActive: values.isActive,
      };
      if (values.category === "medical") {
        payload.acceptingPatients = values.acceptingPatients;
      }
      const cat = values.category;
      const url = isEdit
        ? `/api/resources/${cat}/${initial?.id}`
        : `/api/resources/${cat}`;
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
      router.push(
        `/resources/${data.id ?? initial?.id}?category=${cat}`,
      );
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
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={(v) =>
                  form.setValue("category", v as ResourceCategory)
                }
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
              <Input id="description" {...form.register("description")} />
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address1">Address line 1</Label>
              <Input id="address1" {...form.register("address1")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address2">Address line 2</Label>
              <Input id="address2" {...form.register("address2")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...form.register("state")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" {...form.register("postalCode")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="services">Services</Label>
              <Input
                id="services"
                placeholder="Comma-separated services offered"
                {...form.register("services")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                placeholder="Mon-Fri 9am-5pm"
                {...form.register("hours")}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4 rounded border"
                checked={form.watch("isActive")}
                onChange={(e) => form.setValue("isActive", e.target.checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            {category === "medical" && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="acceptingPatients"
                  type="checkbox"
                  className="h-4 w-4 rounded border"
                  checked={form.watch("acceptingPatients")}
                  onChange={(e) =>
                    form.setValue("acceptingPatients", e.target.checked)
                  }
                />
                <Label htmlFor="acceptingPatients">Accepting new patients</Label>
              </div>
            )}
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
