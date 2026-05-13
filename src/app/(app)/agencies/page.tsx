import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { Agency } from "@/lib/types";
import { AgenciesTable } from "./agencies-table";

async function loadAgencies(): Promise<Agency[]> {
  try {
    const result = await api.get<Agency[] | { items: Agency[] }>("/agencies");
    if (Array.isArray(result)) return result;
    return result.items ?? [];
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("agencies fetch failed", error.status, error.body);
    }
    return [];
  }
}

export default async function AgenciesPage() {
  const agencies = await loadAgencies();

  return (
    <div>
      <PageHeader
        title="Agencies"
        description="Manage agencies in your organization."
        action={
          <Button asChild className="bg-sky-600 hover:bg-sky-700">
            <Link href="/agencies/new">
              <Plus className="mr-2 h-4 w-4" /> New agency
            </Link>
          </Button>
        }
      />
      <AgenciesTable data={agencies} />
    </div>
  );
}
