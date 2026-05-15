"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { IdCard, KeyRound, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatName, initials } from "@/lib/utils";
import type { StaffMember, User } from "@/lib/types";
import { CredentialsDialog } from "./credentials-dialog";

type StatusFilter = "all" | "active" | "inactive";

function staffName(s: StaffMember): string {
  return s.name?.trim() || formatName(s);
}

function staffEmail(s: StaffMember): string {
  return s.emailAddress ?? s.email;
}

function staffActive(s: StaffMember): boolean {
  return s.active ?? s.isActive;
}

export function StaffTable({
  data,
  phoneTypes,
}: {
  data: StaffMember[];
  phoneTypes: Map<number, string>;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [credentialsFor, setCredentialsFor] = useState<StaffMember | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (statusFilter === "all") return data;
    const wantActive = statusFilter === "active";
    return data.filter((s) => staffActive(s) === wantActive);
  }, [data, statusFilter]);

  async function toggleSurvey(staff: StaffMember, next: boolean) {
    setTogglingId(staff.id);
    setOptimistic((prev) => ({ ...prev, [staff.id]: next }));
    try {
      const res = await fetch(`/api/staff/${staff.id}/survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSurveyEnabled: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Survey toggle failed");
        setOptimistic((prev) => {
          const { [staff.id]: _, ...rest } = prev;
          return rest;
        });
        return;
      }
      toast.success(
        `Survey ${next ? "enabled" : "disabled"} for ${staffName(staff)}`,
      );
      router.refresh();
    } catch {
      toast.error("Network error — try again");
      setOptimistic((prev) => {
        const { [staff.id]: _, ...rest } = prev;
        return rest;
      });
    } finally {
      setTogglingId(null);
    }
  }

  function surveyValue(staff: StaffMember): boolean {
    if (staff.id in optimistic) return optimistic[staff.id];
    return staff.isSurveyEnabled ?? false;
  }

  const columns = useMemo<ColumnDef<StaffMember>[]>(
    () => [
      {
        id: "avatar",
        header: "",
        cell: ({ row }) => (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sky-100 text-xs text-sky-700">
              {initials(staffName(row.original))}
            </AvatarFallback>
          </Avatar>
        ),
      },
      {
        id: "name",
        accessorFn: (row) => staffName(row),
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{staffName(row.original)}</span>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const phones = row.original.phoneNumbers ?? [];
          if (phones.length > 0) {
            return (
              <div className="flex flex-col">
                {phones.slice(0, 2).map((p, i) => (
                  <span key={i} className="text-sm">
                    {p.number}
                    <span className="ml-1 text-xs text-muted-foreground capitalize">
                      ({phoneTypes.get(Number(p.type)) ?? p.type})
                    </span>
                  </span>
                ))}
              </div>
            );
          }
          return row.original.phone ?? "—";
        },
      },
      {
        id: "email",
        accessorFn: (row) => staffEmail(row),
        header: "Email",
        cell: ({ row }) => staffEmail(row.original),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={staffActive(row.original) ? "default" : "secondary"}
            className="rounded-full"
          >
            {staffActive(row.original) ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "credentials",
        header: "Credentials",
        cell: ({ row }) => {
          const u = row.original.user;
          return (
            <Button
              type="button"
              variant={u ? "ghost" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCredentialsFor(row.original);
              }}
            >
              {u ? (
                <>
                  <KeyRound className="mr-2 h-3.5 w-3.5" /> {u.username}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-3.5 w-3.5" /> Add
                </>
              )}
            </Button>
          );
        },
      },
      {
        id: "survey",
        header: "Survey",
        cell: ({ row }) => (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Switch
              checked={surveyValue(row.original)}
              disabled={togglingId === row.original.id}
              onCheckedChange={(checked) =>
                toggleSurvey(row.original, checked)
              }
              aria-label={`Toggle survey for ${staffName(row.original)}`}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglingId, optimistic],
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <IdCard className="h-10 w-10 text-muted-foreground" aria-hidden />
          <h3 className="text-lg font-semibold">No staff members yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Add your first staff member to start managing access and survey
            enrollment.
          </p>
          <Button asChild className="mt-2 bg-sky-600 hover:bg-sky-700">
            <Link href="/staff/new">
              <Plus className="mr-2 h-4 w-4" /> Add staff
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              if (v) setStatusFilter(v as StatusFilter);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name…"
        rowHref={(s) => `/staff/${s.id}`}
        emptyMessage="No staff members match these filters."
      />
      <CredentialsDialog
        staff={credentialsFor}
        onOpenChange={(open) => {
          if (!open) setCredentialsFor(null);
        }}
        onSaved={(user: User | null) => {
          if (credentialsFor) {
            toast.success(
              user
                ? `Credentials saved for ${staffName(credentialsFor)}`
                : `Credentials removed for ${staffName(credentialsFor)}`,
            );
          }
          setCredentialsFor(null);
          router.refresh();
        }}
      />
    </div>
  );
}
