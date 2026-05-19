import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { api, ApiError } from "@/lib/api";
import type { Insurer } from "@/lib/types";
import { InsurerForm } from "../../insurer-form";
import { DeleteInsurerButton } from "../delete-insurer-button";

async function loadInsurer(id: string): Promise<Insurer | null> {
  try {
    return await api.get<Insurer>(`/insurers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function EditInsurerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insurer = await loadInsurer(id);
  if (!insurer) notFound();

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href={`/insurers/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to insurer
        </Link>
      </Button>
      <PageHeader
        title={`Edit ${insurer.name}`}
        description="Update this insurer's information."
      />
      <InsurerForm
        initial={insurer}
        footerLeft={<DeleteInsurerButton id={insurer.id} name={insurer.name} />}
      />
    </div>
  );
}
