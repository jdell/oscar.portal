"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

interface SidebarProps {
  orgName: string;
  userDisplayName: string;
}

export function Sidebar({ orgName, userDisplayName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between px-3 h-14 border-b">
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Organization
            </span>
            <span className="text-sm font-semibold truncate">{orgName}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.matches
              ? item.matches(pathname)
              : pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sky-600 text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />
      <div
        className={cn(
          "p-3 text-xs text-muted-foreground",
          collapsed && "text-center",
        )}
      >
        {collapsed ? "OA" : `Signed in as ${userDisplayName}`}
      </div>
    </aside>
  );
}
