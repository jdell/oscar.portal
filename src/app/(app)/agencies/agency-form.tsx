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
import type { Agency } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface AgencyFormProps {
  initial?: Partial<Agency> & { email?: string; phone?: string; website?: string };
}

export function AgencyForm({ initial }: AgencyFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      shortName: initial?.shortName ?? "",
      status: (initial?.status as FormValues["status"]) ?? "active",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      website: initial?.website ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/agencies/${initial?.id}` : "/api/agencies";
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

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as FormValues["status"])
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
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
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create agency"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
