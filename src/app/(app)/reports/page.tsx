import {
  Activity,
  HeartPulse,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type {
  DashboardStats,
  OutcomesSummary,
  ProgramEffectiveness,
} from "./types";
import { DateRangeFilter } from "./date-range-filter";
import { OutcomeBars } from "./outcome-bars";
import { AgencyComparison } from "./agency-comparison";

interface RangeParams {
  from?: string;
  to?: string;
}

async function loadStats(range: RangeParams): Promise<DashboardStats | null> {
  try {
    return await api.get<DashboardStats>("/dashboard/stats", {
      searchParams: { from: range.from, to: range.to },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("dashboard/stats failed", error.status);
    }
    return null;
  }
}

async function loadOutcomes(
  range: RangeParams,
): Promise<OutcomesSummary | null> {
  try {
    return await api.get<OutcomesSummary>("/analytics/outcomes/summary", {
      searchParams: { from: range.from, to: range.to },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("outcomes/summary failed", error.status);
    }
    return null;
  }
}

async function loadEffectiveness(
  range: RangeParams,
): Promise<ProgramEffectiveness | null> {
  try {
    return await api.get<ProgramEffectiveness>(
      "/analytics/program-effectiveness",
      { searchParams: { from: range.from, to: range.to } },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("program-effectiveness failed", error.status);
    }
    return null;
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<RangeParams>;
}) {
  const sp = await searchParams;
  const range: RangeParams = { from: sp.from, to: sp.to };

  const [stats, outcomes, effectiveness] = await Promise.all([
    loadStats(range),
    loadOutcomes(range),
    loadEffectiveness(range),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={
          range.from && range.to
            ? `${formatDate(range.from)} → ${formatDate(range.to)}`
            : "Snapshot of your organization's activity."
        }
        action={<DateRangeFilter initial={range} />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Users size={16} />}
          label="Participants"
          value={stats?.totalParticipants ?? 0}
        />
        <Stat
          icon={<HeartPulse size={16} />}
          label="Screenings"
          value={stats?.totalScreenings ?? 0}
        />
        <Stat
          icon={<CheckCircle2 size={16} />}
          label="Follow-ups"
          value={stats?.totalFollowUps ?? 0}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <TrendingUp size={16} />
              Avg health score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats ? stats.averageHealthScore.toFixed(1) : "—"}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / 100
              </span>
            </p>
            {stats && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-sky-600"
                  style={{
                    width: `${Math.min(100, Math.max(0, stats.averageHealthScore))}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity size={14} className="text-sky-600" />
              Outcomes summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outcomes && outcomes.buckets.length > 0 ? (
              <OutcomeBars outcomes={outcomes} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No outcome data for this range.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Agency comparison</CardTitle>
            <p className="text-xs text-muted-foreground">
              {effectiveness
                ? `${effectiveness.byAgency.length} agencies`
                : "—"}
            </p>
          </CardHeader>
          <CardContent>
            {effectiveness && effectiveness.byAgency.length > 0 ? (
              <AgencyComparison rows={effectiveness.byAgency} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No agency data for this range.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
