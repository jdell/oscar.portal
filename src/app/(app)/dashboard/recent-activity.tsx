import Link from "next/link";
import {
  Building2,
  HeartPulse,
  Stethoscope,
  Tag,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type {
  DashboardActivityEvent,
  DashboardEntityKey,
} from "@/lib/types";

const ENTITY_ROUTE: Record<DashboardEntityKey, (id: string) => string> = {
  agencies: (id) => `/agencies/${id}`,
  staff: (id) => `/staff/${id}`,
  providers: (id) => `/providers/${id}`,
  "healthy-living-resources": (id) => `/resources/${id}`,
  "medical-resources": (id) => `/resources/${id}`,
  "referral-reasons": () => `/reports`,
};

const ENTITY_LABEL: Record<DashboardEntityKey, string> = {
  agencies: "Agency",
  staff: "Staff member",
  providers: "Provider",
  "healthy-living-resources": "Healthy living resource",
  "medical-resources": "Medical resource",
  "referral-reasons": "Referral reason",
};

const ENTITY_ICON: Record<DashboardEntityKey, React.ReactNode> = {
  agencies: <Building2 size={14} />,
  staff: <Users size={14} />,
  providers: <Stethoscope size={14} />,
  "healthy-living-resources": <HeartPulse size={14} />,
  "medical-resources": <HeartPulse size={14} />,
  "referral-reasons": <Tag size={14} />,
};

export function RecentActivity({
  events,
}: {
  events: DashboardActivityEvent[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recent activity to show.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((e, i) => {
              const href = ENTITY_ROUTE[e.entityKey](String(e.entityId));
              return (
                <li key={`${e.entityKey}-${e.entityId}-${i}`}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted"
                  >
                    <span className="text-muted-foreground">
                      {ENTITY_ICON[e.entityKey]}
                    </span>
                    <span className="flex-1 truncate">
                      <span className="font-medium">{e.displayName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ENTITY_LABEL[e.entityKey]}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(e.createdAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
