"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgencyEffectiveness } from "./types";

type SortKey =
  | "agencyName"
  | "participants"
  | "screeningsCompleted"
  | "followUpsCompleted"
  | "averageHealthScore"
  | "completionRate";

export function AgencyComparison({ rows }: { rows: AgencyEffectiveness[] }) {
  const [sort, setSort] = useState<SortKey>("participants");
  const [desc, setDesc] = useState(true);

  const maxParticipants = useMemo(
    () => Math.max(1, ...rows.map((r) => r.participants)),
    [rows],
  );

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (typeof av === "string" && typeof bv === "string") {
        return desc ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      const an = Number(av);
      const bn = Number(bv);
      return desc ? bn - an : an - bn;
    });
    return out;
  }, [rows, sort, desc]);

  function setSortBy(key: SortKey) {
    if (key === sort) setDesc((d) => !d);
    else {
      setSort(key);
      setDesc(true);
    }
  }

  const header = (label: string, key: SortKey, align: "left" | "right" = "right") => (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => setSortBy(key)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          sort === key ? "text-foreground font-medium" : "text-muted-foreground"
        }`}
      >
        {label}
        {sort === key && <span className="text-[10px]">{desc ? "▼" : "▲"}</span>}
      </button>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {header("Agency", "agencyName", "left")}
            {header("Participants", "participants")}
            {header("Screenings", "screeningsCompleted")}
            {header("Follow-ups", "followUpsCompleted")}
            {header("Health score", "averageHealthScore")}
            {header("Completion", "completionRate")}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => {
            const partPct = (r.participants / maxParticipants) * 100;
            const completionPct = Math.round(r.completionRate * 100);
            return (
              <TableRow key={r.agencyId}>
                <TableCell className="font-medium">{r.agencyName}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-sky-600"
                        style={{ width: `${partPct}%` }}
                      />
                    </div>
                    <span className="tabular-nums w-12 text-right">
                      {r.participants.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.screeningsCompleted.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.followUpsCompleted.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.averageHealthScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span
                    className={
                      completionPct >= 80
                        ? "text-emerald-600"
                        : completionPct >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                    }
                  >
                    {completionPct}%
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
