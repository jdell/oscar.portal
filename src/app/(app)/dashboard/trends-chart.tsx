import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTrends } from "@/lib/types";

interface TrendsChartProps {
  trends: DashboardTrends | null;
}

export function TrendsChart({ trends }: TrendsChartProps) {
  if (!trends || trends.points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No trend data available for this period.
        </CardContent>
      </Card>
    );
  }

  const points = trends.points;
  const width = 600;
  const height = 160;
  const padding = 20;

  const maxParticipants = Math.max(
    1,
    ...points.map((p) => p.participantsEnrolled),
  );
  const maxReferrals = Math.max(1, ...points.map((p) => p.referralsCreated));
  const max = Math.max(maxParticipants, maxReferrals);

  const xStep =
    points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const pathFor = (key: "participantsEnrolled" | "referralsCreated") =>
    points
      .map((p, i) => {
        const x = padding + i * xStep;
        const y =
          height -
          padding -
          ((p[key] ?? 0) / max) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Trends</CardTitle>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-3 rounded bg-sky-500" /> Participants
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-3 rounded bg-violet-500" /> Referrals
          </span>
          <span>· {trends.granularity}</span>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-40 w-full"
          aria-label="Participants enrolled and referrals created over time"
        >
          <path
            d={pathFor("participantsEnrolled")}
            stroke="#0EA5E9"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={pathFor("referralsCreated")}
            stroke="#8B5CF6"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </CardContent>
    </Card>
  );
}
