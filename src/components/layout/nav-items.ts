import {
  Building2,
  Users,
  HeartPulse,
  Stethoscope,
  Shield,
  MapPin,
  Lock,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  matches?: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Agencies",
    href: "/agencies",
    icon: Building2,
    matches: (p) => p.startsWith("/agencies"),
  },
  {
    label: "Staff",
    href: "/staff",
    icon: Users,
    matches: (p) => p.startsWith("/staff"),
  },
  {
    label: "Resources",
    href: "/resources",
    icon: HeartPulse,
    matches: (p) => p.startsWith("/resources"),
  },
  {
    label: "Providers",
    href: "/providers",
    icon: Stethoscope,
    matches: (p) => p.startsWith("/providers"),
  },
  {
    label: "Insurers",
    href: "/insurers",
    icon: Shield,
    matches: (p) => p.startsWith("/insurers"),
  },
  {
    label: "Locations",
    href: "/locations",
    icon: MapPin,
    matches: (p) => p.startsWith("/locations"),
  },
  {
    label: "Permissions",
    href: "/permissions",
    icon: Lock,
    matches: (p) => p.startsWith("/permissions"),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    matches: (p) => p.startsWith("/reports"),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    matches: (p) => p.startsWith("/settings"),
  },
];
