"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_PERIODS,
  type DashboardPeriod,
} from "@/lib/types";

interface PeriodSelectorProps {
  active: DashboardPeriod;
}

export function PeriodSelector({ active }: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setPeriod = (next: DashboardPeriod) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("period", next);
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <div
      role="tablist"
      aria-label="Period"
      className="inline-flex rounded-md border bg-card p-0.5"
    >
      {DASHBOARD_PERIODS.map((p) => (
        <Button
          key={p}
          type="button"
          role="tab"
          aria-selected={active === p}
          size="sm"
          variant="ghost"
          onClick={() => setPeriod(p)}
          className={cn(
            "rounded-sm px-3 py-1 text-xs font-medium",
            active === p
              ? "bg-sky-600 text-white hover:bg-sky-700 hover:text-white"
              : "text-muted-foreground",
          )}
        >
          {p}
        </Button>
      ))}
    </div>
  );
}
