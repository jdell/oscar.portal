"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Preset = "this-fy" | "last-quarter" | "last-month" | "last-week";

interface Range {
  from: string;
  to: string;
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(preset: Preset): Range {
  const today = new Date();

  if (preset === "this-fy") {
    // Fiscal year: Oct 1 – Sep 30
    const fyStart =
      today.getMonth() >= 9
        ? new Date(today.getFullYear(), 9, 1)
        : new Date(today.getFullYear() - 1, 9, 1);
    return { from: fmt(fyStart), to: fmt(today) };
  }

  if (preset === "last-quarter") {
    const q = Math.floor(today.getMonth() / 3);
    const pq = q === 0 ? 3 : q - 1;
    const yr = q === 0 ? today.getFullYear() - 1 : today.getFullYear();
    return {
      from: fmt(new Date(yr, pq * 3, 1)),
      to: fmt(new Date(yr, pq * 3 + 3, 0)),
    };
  }

  if (preset === "last-month") {
    return {
      from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)),
    };
  }

  // last-week: Mon–Sun of previous calendar week
  const daysBack = ((today.getDay() + 6) % 7) + 7;
  const mon = new Date(today);
  mon.setDate(today.getDate() - daysBack);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { from: fmt(mon), to: fmt(sun) };
}

function matchPreset(from: string, to: string): Preset | null {
  for (const p of [
    "this-fy",
    "last-quarter",
    "last-month",
    "last-week",
  ] as Preset[]) {
    const r = presetRange(p);
    if (r.from === from && r.to === to) return p;
  }
  return null;
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "this-fy", label: "This FY" },
  { key: "last-quarter", label: "Last quarter" },
  { key: "last-month", label: "Last month" },
  { key: "last-week", label: "Last week" },
];

export function DateRangeFilter({
  initial,
}: {
  initial: { from?: string; to?: string };
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [customOpen, setCustomOpen] = useState(
    !matchPreset(initial.from ?? "", initial.to ?? ""),
  );

  const activePreset = matchPreset(from, to);

  function navigate(f: string, t: string) {
    const sp = new URLSearchParams();
    if (f) sp.set("from", f);
    if (t) sp.set("to", t);
    router.push(`/reports?${sp.toString()}`);
  }

  function applyPreset(preset: Preset) {
    const r = presetRange(preset);
    setFrom(r.from);
    setTo(r.to);
    setCustomOpen(false);
    navigate(r.from, r.to);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {PRESETS.map(({ key, label }) => (
        <Button
          key={key}
          variant={activePreset === key && !customOpen ? "default" : "outline"}
          size="sm"
          className={cn(
            activePreset === key &&
              !customOpen &&
              "bg-sky-600 text-white hover:bg-sky-700",
          )}
          onClick={() => applyPreset(key)}
        >
          {label}
        </Button>
      ))}
      <Button
        variant={customOpen ? "default" : "outline"}
        size="sm"
        className={cn(customOpen && "bg-sky-600 text-white hover:bg-sky-700")}
        onClick={() => setCustomOpen((o) => !o)}
      >
        Custom
      </Button>

      {customOpen && (
        <>
          <div className="space-y-1">
            <Label htmlFor="from-date" className="text-xs">
              From
            </Label>
            <Input
              id="from-date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to-date" className="text-xs">
              To
            </Label>
            <Input
              id="to-date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            onClick={() => navigate(from, to)}
            size="sm"
            className="bg-sky-600 hover:bg-sky-700"
          >
            Apply
          </Button>
        </>
      )}
    </div>
  );
}
