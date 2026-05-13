import Link from "next/link";
import { Building2, CheckCircle2, PlusCircle, TrendingUp, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { api, ApiError } from "@/lib/api";
import type {
  Agency,
  AgencyFilterOptions,
  AgencySummary,
} from "@/lib/types";
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

async function loadFilterOptions(): Promise<AgencyFilterOptions> {
  try {
    return await api.get<AgencyFilterOptions>("/agencies/filter-options");
  } catch {
    return { states: [], counties: [], insurers: [] };
  }
}

async function loadSummary(): Promise<AgencySummary | null> {
  try {
    return await api.get<AgencySummary>("/agencies/summary");
  } catch {
    return null;
  }
}

export default async function AgenciesPage() {
  const [agencies, filterOptions, summary] = await Promise.all([
    loadAgencies(),
    loadFilterOptions(),
    loadSummary(),
  ]);

  const total =
    summary?.total ?? agencies.length;
  const active =
    summary?.active ??
    agencies.filter((a) => a.active ?? a.status === "active").length;

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

      <section
        aria-label="Agency stats"
        className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          title="Total agencies"
          icon={<Building2 size={16} />}
          accent="#1E88E5"
          value={total}
        />
        <KpiCard
          title="Active"
          icon={<CheckCircle2 size={16} />}
          accent="#16A34A"
          value={active}
          secondaryLabel="Total"
          secondaryValue={total}
        />
        <KpiCard
          title="New in period"
          icon={<PlusCircle size={16} />}
          accent="#F57C00"
          value={summary?.newInPeriod ?? null}
          delta={
            summary
              ? {
                  current: summary.newInPeriod,
                  previous: summary.newInPreviousPeriod,
                }
              : null
          }
        />
        <KpiCard
          title="7-day trend"
          icon={<TrendingUp size={16} />}
          accent="#8E24AA"
          value={summary?.active ?? null}
          sparkline={summary?.sparkline7d ?? []}
        />
      </section>

      <AgenciesTable data={agencies} filterOptions={filterOptions} />
    </div>
  );
}
