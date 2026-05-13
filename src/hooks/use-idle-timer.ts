"use client";

import { useCallback, useEffect, useRef } from "react";

interface IdleTimerOptions {
  timeoutMs: number;
  warningMs: number;
  onWarning: () => void;
  onTimeout: () => void;
  disabled?: boolean;
}

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

export function useIdleTimer({
  timeoutMs,
  warningMs,
  onWarning,
  onTimeout,
  disabled = false,
}: IdleTimerOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);

  onWarningRef.current = onWarning;
  onTimeoutRef.current = onTimeout;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const reset = useCallback(() => {
    if (disabled) return;
    clearTimers();
    warnedRef.current = false;

    warningRef.current = setTimeout(() => {
      warnedRef.current = true;
      onWarningRef.current();
    }, warningMs);

    timeoutRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  }, [disabled, clearTimers, warningMs, timeoutMs]);

  useEffect(() => {
    if (disabled) {
      clearTimers();
      return;
    }

    reset();

    const handleActivity = () => {
      if (!warnedRef.current) reset();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [disabled, reset, clearTimers]);

  return { reset };
}
