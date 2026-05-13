"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { useLock } from "./lock-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

const MAX_ATTEMPTS = 5;

interface LockScreenProps {
  userEmail: string;
  orgName: string;
}

export function LockScreen({ userEmail, orgName }: LockScreenProps) {
  const { isLocked, unlock } = useLock();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const attemptsRef = useRef(0);

  if (!isLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        // Firebase session lost — force full login
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        return;
      }

      const credential = EmailAuthProvider.credential(userEmail, password);
      await reauthenticateWithCredential(currentUser, credential);

      // Refresh the oscar.apii session token in case it expired during lock
      await fetch("/api/auth/refresh", { method: "POST" });

      attemptsRef.current = 0;
      setPassword("");
      unlock();
    } catch {
      attemptsRef.current += 1;

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        return;
      }

      const remaining = MAX_ATTEMPTS - attemptsRef.current;
      setError(
        `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Session locked</h2>
          <p className="text-sm text-muted-foreground">
            {orgName} · {userEmail}
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lock-password">Password</Label>
            <Input
              id="lock-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting || !password}>
            {submitting ? "Verifying…" : "Unlock"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
          >
            Sign in as a different user
          </button>
        </div>
      </div>
    </div>
  );
}
