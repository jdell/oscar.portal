import type { OutcomesSummary } from "./types";

export function OutcomeBars({ outcomes }: { outcomes: OutcomesSummary }) {
  const max = Math.max(1, ...outcomes.buckets.map((b) => b.count));

  return (
    <ul className="space-y-2.5">
      {outcomes.buckets.map((b) => {
        const pct = (b.count / max) * 100;
        const shareOfTotal = outcomes.total > 0 ? (b.count / outcomes.total) * 100 : 0;
        return (
          <li key={b.label} className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="truncate font-medium">{b.label}</span>
              <span className="text-muted-foreground">
                {b.count.toLocaleString()}
                <span className="ml-1 text-[10px]">
                  ({shareOfTotal.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={b.count}
              aria-valuemax={max}
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-sky-600 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
