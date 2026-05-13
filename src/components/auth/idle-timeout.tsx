"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIdleTimer } from "@/hooks/use-idle-timer";

const TIMEOUT_MS = 20 * 60 * 1000;   // 20 min — hard logout
const WARNING_MS = 17 * 60 * 1000;   // 17 min — show dialog
const LOCK_MS = 15 * 60 * 1000;      // 15 min — trigger lock

interface IdleTimeoutProps {
  onLock?: () => void;
  isLocked?: boolean;
}

export function IdleTimeout({ onLock, isLocked = false }: IdleTimeoutProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);

  const handleTimeout = useCallback(async () => {
    setShowWarning(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }, [router]);

  const { reset } = useIdleTimer({
    timeoutMs: TIMEOUT_MS,
    warningMs: WARNING_MS,
    disabled: isLocked,
    onWarning: () => setShowWarning(true),
    onTimeout: handleTimeout,
  });

  // Separate shorter timer for lock trigger
  useIdleTimer({
    timeoutMs: LOCK_MS,
    warningMs: LOCK_MS, // no separate warning for lock — just trigger
    disabled: isLocked,
    onWarning: () => {}, // no-op
    onTimeout: () => onLock?.(),
  });

  const handleStaySignedIn = () => {
    setShowWarning(false);
    reset();
  };

  return (
    <Dialog open={showWarning} onOpenChange={(open) => !open && handleStaySignedIn()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Session expiring</DialogTitle>
          <DialogDescription>
            Your session will expire in a few minutes due to inactivity. Click
            below to stay signed in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleTimeout}>
            Sign out
          </Button>
          <Button onClick={handleStaySignedIn}>Stay signed in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
