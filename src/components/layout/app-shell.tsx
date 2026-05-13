import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { AuthSession } from "@/lib/types";

interface AppShellProps {
  session: AuthSession;
  children: ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  const orgName = session.user.organizationName;
  const userDisplayName = session.user.displayName;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar orgName={orgName} userDisplayName={userDisplayName} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          orgName={orgName}
          userDisplayName={userDisplayName}
          userEmail={session.user.email}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
