"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateRangeFilter({
  initial,
}: {
  initial: { from?: string; to?: string };
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  function apply() {
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    const qs = sp.toString();
    router.push(`/reports${qs ? `?${qs}` : ""}`);
  }

  function clear() {
    setFrom("");
    setTo("");
    router.push("/reports");
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs">
          From
        </Label>
        <Input
          id="from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">
          To
        </Label>
        <Input
          id="to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40"
        />
      </div>
      <Button onClick={apply} className="bg-sky-600 hover:bg-sky-700">
        Apply
      </Button>
      {(initial.from || initial.to) && (
        <Button variant="outline" onClick={clear}>
          Clear
        </Button>
      )}
    </div>
  );
}
