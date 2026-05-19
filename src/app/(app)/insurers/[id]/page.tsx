import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Insurer, InsurerType } from "@/lib/types";

const TYPE_LABEL: Record<InsurerType, string> = {
  medicare: "Medicare",
  medicaid: "Medicaid",
  private: "Private",
  other: "Other",
};

const TYPE_TAG_CLASS: Record<InsurerType, string> = {
  medicare: "bg-sky-100 text-sky-700 ring-sky-200",
  medicaid: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  private: "bg-amber-100 text-amber-700 ring-amber-200",
  other: "bg-slate-100 text-slate-700 ring-slate-200",
};

async function loadInsurer(id: string): Promise<Insurer | null> {
  try {
    return await api.get<Insurer>(`/insurers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function InsurerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insurer = await loadInsurer(id);
  if (!insurer) notFound();

  const t = insurer.type ?? "other";

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/insurers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to insurers
        </Link>
      </Button>

      <PageHeader
        title={insurer.name}
        action={
          <Button asChild variant="outline">
            <Link href={`/insurers/${insurer.id}/edit`}>Edit</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24 shrink-0">
              Type
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                TYPE_TAG_CLASS[t],
              )}
            >
              {TYPE_LABEL[t]}
            </span>
          </div>

          <Separator />

          <div className="flex gap-3">
            <span className="text-sm text-muted-foreground w-24 shrink-0 pt-0.5">
              Coverage
            </span>
            {insurer.coverage ? (
              <p className="text-sm whitespace-pre-wrap">{insurer.coverage}</p>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
