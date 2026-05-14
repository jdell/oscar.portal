import Link from "next/link";
import {
  Building2,
  ClipboardList,
  Globe,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  {
    label: "Add agency",
    href: "/agencies/new",
    icon: Building2,
    accent: "text-sky-600 bg-sky-50",
  },
  {
    label: "Add staff",
    href: "/staff/new",
    icon: UserPlus,
    accent: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Add provider",
    href: "/providers/new",
    icon: Globe,
    accent: "text-violet-600 bg-violet-50",
  },
  {
    label: "Add survey",
    href: "/surveys/new",
    icon: ClipboardList,
    accent: "text-amber-600 bg-amber-50",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Quick actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${a.accent}`}
                  aria-hidden
                >
                  <Icon size={14} />
                </span>
                <span className="font-medium">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
