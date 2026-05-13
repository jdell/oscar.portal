import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string | null | undefined;
  icon?: React.ReactNode;
  accent?: string;
  secondaryLabel?: string;
  secondaryValue?: number | string | null;
  delta?: { current?: number | null; previous?: number | null } | null;
  sparkline?: number[];
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon,
  accent = "#0284c7",
  secondaryLabel,
  secondaryValue,
  delta,
  sparkline,
  loading,
  className,
}: KpiCardProps) {
  const deltaPct =
    delta?.current != null &&
    delta.previous != null &&
    delta.previous > 0
      ? ((delta.current - delta.previous) / delta.previous) * 100
      : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {title}
            </span>
            <span className="text-2xl font-semibold">
              {loading ? (
                <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted" />
              ) : value == null ? (
                "—"
              ) : (
                value.toLocaleString()
              )}
            </span>
            {secondaryLabel && (
              <span className="text-xs text-muted-foreground">
                {secondaryLabel}: {secondaryValue ?? "—"}
              </span>
            )}
            {deltaPct != null && (
              <span
                className={cn(
                  "text-xs font-medium",
                  deltaPct >= 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}% vs
                prior
              </span>
            )}
          </div>
          {icon && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accent}1a`, color: accent }}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline points={sparkline} color={accent} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
}

function Sparkline({
  points,
  color,
  className,
}: {
  points: number[];
  color: string;
  className?: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 24;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-6 w-full", className)}
      aria-hidden="true"
    >
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
