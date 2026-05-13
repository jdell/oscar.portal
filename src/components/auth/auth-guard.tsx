"use client";

import type { AuthSession } from "@/lib/types";
import { LockProvider, useLock } from "./lock-context";
import { LockScreen } from "./lock-screen";
import { IdleTimeout } from "./idle-timeout";

interface AuthGuardInnerProps {
  session: AuthSession;
  children: React.ReactNode;
}

function AuthGuardInner({ session, children }: AuthGuardInnerProps) {
  const { isLocked, lock } = useLock();

  return (
    <>
      {children}
      <IdleTimeout onLock={lock} isLocked={isLocked} />
      <LockScreen
        userEmail={session.user.email}
        orgName={session.user.organizationName}
      />
    </>
  );
}

export function AuthGuard({ session, children }: AuthGuardInnerProps) {
  return (
    <LockProvider>
      <AuthGuardInner session={session}>{children}</AuthGuardInner>
    </LockProvider>
  );
}
