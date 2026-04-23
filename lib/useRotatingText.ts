"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through an array of messages while `active` is true.
 * Stops at the last message (doesn't loop) so it feels like progressing
 * through real stages instead of looping forever.
 */
export function useRotatingText(
  messages: readonly string[],
  intervalMs: number = 1800,
  active: boolean = true
): string {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setIdx(0);
      return;
    }
    setIdx(0);
    const t = setInterval(() => {
      setIdx((i) => Math.min(i + 1, messages.length - 1));
    }, intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs, messages.length]);

  return messages[idx] ?? messages[messages.length - 1] ?? "";
}
