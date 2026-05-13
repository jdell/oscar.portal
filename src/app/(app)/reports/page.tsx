import { Building2, Users, Stethoscope, HeartPulse, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import type { ReportSummary } from "@/lib/types";

async function loadSummary(): Promise<ReportSummary> {
  const empty: ReportSummary = {
    totalAgencies: 0,
    totalStaff: 0,
    totalProviders: 0,
    totalResources: 0,
    activeReferralsLast30d: 0,
  };
  try {
    return await api.get<ReportSummary>("/reports/summary");
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("reports/summary fetch failed", error.status);
    }
    return empty;
  }
}

export default async function ReportsPage() {
  const s = await loadSummary();
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Snapshot of your organization's activity."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Stat icon={<Building2 size={16} />} label="Agencies" value={s.totalAgencies} />
        <Stat icon={<Users size={16} />} label="Staff" value={s.totalStaff} />
        <Stat icon={<Stethoscope size={16} />} label="Providers" value={s.totalProviders} />
        <Stat icon={<HeartPulse size={16} />} label="Resources" value={s.totalResources} />
        <Stat
          icon={<Activity size={16} />}
          label="Referrals (30d)"
          value={s.activeReferralsLast30d}
        />
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
