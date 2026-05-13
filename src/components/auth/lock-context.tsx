"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface LockContextValue {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

const LockContext = createContext<LockContextValue>({
  isLocked: false,
  lock: () => {},
  unlock: () => {},
});

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(() => setIsLocked(true), []);
  const unlock = useCallback(() => setIsLocked(false), []);

  return (
    <LockContext value={{ isLocked, lock, unlock }}>
      {children}
    </LockContext>
  );
}

export function useLock() {
  return useContext(LockContext);
}
