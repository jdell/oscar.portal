import Link from "next/link";
import {
  Building2,
  CalendarClock,
  HeartPulse,
  Send,
  Stethoscope,
  Tag,
  UserCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loadOverview,
  loadRecentActivity,
  loadTrends,
} from "@/lib/dashboard-data";
import type {
  DashboardEntityKey,
  DashboardEntitySummary,
  DashboardPeriod,
} from "@/lib/types";
import { DASHBOARD_PERIODS } from "@/lib/types";
import { PeriodSelector } from "./period-selector";
import { TrendsChart } from "./trends-chart";
import { RecentActivity } from "./recent-activity";
import { QuickActions } from "./quick-actions";

const DEFAULT_PERIOD: DashboardPeriod = "30d";

function parsePeriod(value: string | undefined | null): DashboardPeriod {
  if (
    value &&
    (DASHBOARD_PERIODS as readonly string[]).includes(value)
  ) {
    return value as DashboardPeriod;
  }
  return DEFAULT_PERIOD;
}

const ENTITY_META: Record<
  DashboardEntityKey,
  { label: string; href: string; icon: React.ReactNode; accent: string }
> = {
  agencies: {
    label: "Agencies",
    href: "/agencies",
    icon: <Building2 size={16} />,
    accent: "#1E88E5",
  },
  staff: {
    label: "Staff",
    href: "/staff",
    icon: <Users size={16} />,
    accent: "#2E7D32",
  },
  providers: {
    label: "Providers",
    href: "/providers",
    icon: <Stethoscope size={16} />,
    accent: "#8E24AA",
  },
  "healthy-living-resources": {
    label: "Healthy living resources",
    href: "/resources",
    icon: <HeartPulse size={16} />,
    accent: "#16A34A",
  },
  "medical-resources": {
    label: "Medical resources",
    href: "/resources",
    icon: <HeartPulse size={16} />,
    accent: "#0EA5E9",
  },
  "referral-reasons": {
    label: "Referral reasons",
    href: "/reports",
    icon: <Tag size={16} />,
    accent: "#D97706",
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);

  const [overview, trends, activity] = await Promise.all([
    loadOverview(period),
    loadTrends(period),
    loadRecentActivity(20),
  ]);

  const hero = overview?.hero;
  const entitySummaries: DashboardEntitySummary[] =
    overview?.entitySummaries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Dashboard"
          description="Snapshot of activity across your organization."
        />
        <PeriodSelector active={period} />
      </div>

      {!overview && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <span className="text-foreground">
              Dashboard overview is unavailable right now.
            </span>
            <span>Showing fallbacks where possible.</span>
          </CardContent>
        </Card>
      )}

      {/* Hero KPIs */}
      <section
        aria-label="Hero KPIs"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          title="Active participants"
          icon={<UserCheck size={16} />}
          accent="#1565C0"
          value={hero?.activeParticipants?.value ?? null}
          delta={
            hero?.activeParticipants
              ? {
                  current: hero.activeParticipants.value,
                  previous: hero.activeParticipants.previousValue,
                }
              : null
          }
          sparkline={hero?.activeParticipants?.sparkline7d ?? []}
        />
        <KpiCard
          title="Active staff"
          icon={<Users size={16} />}
          accent="#2E7D32"
          value={hero?.activeStaff?.value ?? null}
          delta={
            hero?.activeStaff
              ? {
                  current: hero.activeStaff.value,
                  previous: hero.activeStaff.previousValue,
                }
              : null
          }
          sparkline={hero?.activeStaff?.sparkline7d ?? []}
        />
        <KpiCard
          title="New referrals"
          icon={<Send size={16} />}
          accent="#6A1B9A"
          value={hero?.newReferrals?.value ?? null}
          delta={
            hero?.newReferrals
              ? {
                  current: hero.newReferrals.value,
                  previous: hero.newReferrals.previousValue,
                }
              : null
          }
          sparkline={hero?.newReferrals?.sparkline7d ?? []}
        />
        <KpiCard
          title="Open follow-ups (next 7d)"
          icon={<CalendarClock size={16} />}
          accent="#D84315"
          value={hero?.openFollowUpsNext7Days?.value ?? null}
          delta={
            hero?.openFollowUpsNext7Days
              ? {
                  current: hero.openFollowUpsNext7Days.value,
                  previous: hero.openFollowUpsNext7Days.previousValue,
                }
              : null
          }
          sparkline={hero?.openFollowUpsNext7Days?.sparkline7d ?? []}
        />
      </section>

      {/* Trends */}
      <TrendsChart trends={trends} />

      {/* Entity catalog */}
      <section aria-label="Entity catalog" className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Catalog overview</CardTitle>
          </CardHeader>
          <CardContent>
            {entitySummaries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Catalog summaries unavailable.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entitySummaries.map((s) => {
                  const meta = ENTITY_META[s.key];
                  if (!meta) return null;
                  return (
                    <Link
                      key={s.key}
                      href={meta.href}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                    >
                      <KpiCard
                        title={meta.label}
                        icon={meta.icon}
                        accent={meta.accent}
                        value={s.total}
                        secondaryLabel="Active"
                        secondaryValue={s.active}
                        delta={{
                          current: s.newInPeriod,
                          previous: s.newInPreviousPeriod,
                        }}
                        sparkline={s.sparkline7d}
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity events={activity} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
