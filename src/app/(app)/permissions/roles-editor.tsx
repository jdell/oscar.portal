"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Permission, Role } from "@/lib/types";

interface RolesEditorProps {
  roles: Role[];
  permissions: Permission[];
}

export function RolesEditor({ roles, permissions }: RolesEditorProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string>(roles[0]?.id ?? "");
  const [draftByRole, setDraftByRole] = useState<Record<string, Set<string>>>(
    () => {
      const map: Record<string, Set<string>> = {};
      for (const r of roles) map[r.id] = new Set(r.permissions);
      return map;
    },
  );
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const active = roles.find((r) => r.id === activeId) ?? null;
  const selected = active ? draftByRole[active.id] ?? new Set<string>() : new Set<string>();
  const originalSet = useMemo(
    () => new Set(active?.permissions ?? []),
    [active],
  );

  const dirty = useMemo(() => {
    if (!active) return false;
    if (selected.size !== originalSet.size) return true;
    for (const k of selected) if (!originalSet.has(k)) return true;
    return false;
  }, [active, selected, originalSet]);

  const grouped = useMemo(() => {
    const filtered = permissions.filter((p) => {
      if (!filter.trim()) return true;
      const q = filter.toLowerCase();
      return (
        p.key.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
    const map = new Map<string, Permission[]>();
    for (const p of filtered) {
      const cat = p.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions, filter]);

  function toggle(key: string) {
    if (!active) return;
    setDraftByRole((prev) => {
      const next = new Set(prev[active.id] ?? []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [active.id]: next };
    });
  }

  function reset() {
    if (!active) return;
    setDraftByRole((prev) => ({
      ...prev,
      [active.id]: new Set(active.permissions),
    }));
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${active.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...active,
          permissions: [...selected],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Save failed");
        return;
      }
      toast.success(`Updated permissions for ${active.name}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-sm">Roles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {roles.map((r) => {
              const isActive = r.id === activeId;
              const draftSize = draftByRole[r.id]?.size ?? r.permissions.length;
              const isDirty = draftSize !== r.permissions.length ||
                [...(draftByRole[r.id] ?? [])].some((k) => !r.permissions.includes(k));
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${
                      isActive ? "bg-accent" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Lock size={12} className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{r.name}</span>
                      {isDirty && (
                        <span
                          aria-label="unsaved"
                          className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"
                        />
                      )}
                    </span>
                    <Badge variant="outline" className="shrink-0">
                      {draftSize}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                {active ? active.name : "Select a role"}
              </CardTitle>
              {active?.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {active.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!dirty || saving}
                onClick={reset}
              >
                Reset
              </Button>
              <Button
                size="sm"
                disabled={!dirty || saving}
                onClick={save}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <Save className="mr-1 h-3 w-3" />
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
          <Input
            placeholder="Filter permissions…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent className="space-y-5">
          {!active && (
            <p className="text-sm text-muted-foreground">
              Pick a role on the left to edit its permissions.
            </p>
          )}
          {active && grouped.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No permissions match the filter.
            </p>
          )}
          {active &&
            grouped.map(([category, perms]) => (
              <div key={category}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </h3>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {perms.map((p) => {
                    const isOn = selected.has(p.key);
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm transition-colors ${
                          isOn ? "border-sky-300 bg-sky-50/50" : "hover:bg-accent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggle(p.key)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1">
                          <code className="font-mono text-xs">{p.key}</code>
                          {p.description && (
                            <span className="block text-xs text-muted-foreground">
                              {p.description}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
