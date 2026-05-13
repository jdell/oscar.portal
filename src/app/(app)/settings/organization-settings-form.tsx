"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials } from "@/lib/utils";

export interface OrganizationSettings {
  id: string;
  name: string;
  shortName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  const next: Record<string, unknown> = { ...obj };
  for (const k of Object.keys(next)) {
    if (next[k] === "") next[k] = null;
  }
  return next as T;
}

export function OrganizationSettingsForm({
  organizationId,
  initial,
}: {
  organizationId: string;
  initial: OrganizationSettings;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial.name ?? "",
      shortName: initial.shortName ?? "",
      email: initial.email ?? "",
      phone: initial.phone ?? "",
      website: initial.website ?? "",
      logoUrl: initial.logoUrl ?? "",
      address1: initial.address1 ?? "",
      address2: initial.address2 ?? "",
      city: initial.city ?? "",
      state: initial.state ?? "",
      postalCode: initial.postalCode ?? "",
    },
  });

  const watchedLogo = form.watch("logoUrl");
  const watchedName = form.watch("name") || initial.name;

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emptyToNull(values)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Save failed");
        return;
      }
      toast.success("Organization updated");
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {watchedLogo ? <AvatarImage src={watchedLogo} alt={watchedName} /> : null}
          <AvatarFallback className="bg-sky-600 text-white text-base">
            {initials(watchedName || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            placeholder="https://"
            {...form.register("logoUrl")}
          />
          {form.formState.errors.logoUrl && (
            <p className="text-xs text-destructive">
              {form.formState.errors.logoUrl.message}
            </p>
          )}
        </div>
      </div>

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
          <Label htmlFor="shortName">Short name</Label>
          <Input id="shortName" {...form.register("shortName")} />
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
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={submitting || !form.formState.isDirty}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={submitting || !form.formState.isDirty}
          className="bg-sky-600 hover:bg-sky-700"
        >
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
