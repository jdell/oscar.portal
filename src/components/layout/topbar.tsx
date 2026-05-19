"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

interface TopbarProps {
  orgName: string;
  userDisplayName: string;
  userEmail: string;
}

export function Topbar({ orgName, userDisplayName, userEmail }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
      <MobileNav orgName={orgName} />
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-sky-700">OSCAR Portal</span>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {orgName}
        </Badge>
      </div>
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="User menu"
            render={<Button variant="ghost" className="h-9 gap-2 px-2" />}
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-sky-600 text-white text-xs">
                {initials(userDisplayName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm">{userDisplayName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{userDisplayName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {userEmail}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <User className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
