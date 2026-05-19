"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Insurer, InsurerType } from "@/lib/types";
import { INSURER_TYPES } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["medicare", "medicaid", "private", "other"]).nullable(),
  coverage: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_LABEL: Record<InsurerType, string> = {
  medicare: "Medicare",
  medicaid: "Medicaid",
  private: "Private",
  other: "Other",
};

export function InsurerForm({
  initial,
  footerLeft,
}: {
  initial?: Insurer;
  footerLeft?: React.ReactNode;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: initial?.name ?? "",
      type: initial?.type ?? null,
      coverage: initial?.coverage ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        id: initial?.id,
        name: values.name,
        type: values.type,
        coverage: values.coverage || null,
      };
      const url = isEdit ? `/api/insurers/${initial?.id}` : "/api/insurers";
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
      toast.success(isEdit ? `${values.name} updated` : "Insurer created");
      if (isEdit) {
        router.push(`/insurers/${initial?.id}`);
      } else {
        const created = await response.json().catch(() => null);
        router.push(created?.id ? `/insurers/${created.id}` : "/insurers");
      }
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-lg space-y-4">
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
        <Label htmlFor="type">Type</Label>
        <Select
          value={form.watch("type") ?? "__none__"}
          onValueChange={(v) => {
            if (v === "__none__") form.setValue("type", null);
            else form.setValue("type", v as InsurerType);
          }}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Unspecified</SelectItem>
            {INSURER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverage">Coverage</Label>
        <textarea
          id="coverage"
          rows={4}
          className="w-full rounded-md border bg-background p-2 text-sm"
          placeholder="Describe what this insurer covers…"
          {...form.register("coverage")}
        />
      </div>
      <div className="flex items-center justify-between gap-2 pt-2">
        <div>{footerLeft}</div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );
}
