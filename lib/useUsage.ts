"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usage } from "./types";
import { apiFetch } from "./apiFetch";

type UsageWithPro = Usage & { pro: boolean; proUntil: string | null };

const initial: UsageWithPro = {
  persons: 0,
  memos: 0,
  pro: false,
  proUntil: null,
};

export function useUsage(userId: string) {
  const [usage, setUsage] = useState<UsageWithPro>(initial);
  const [loading, setLoading] = useState(true);

  // 캐시 즉시 hydrate (깜빡임 제거)
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`membar_usage_cache_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          usage: UsageWithPro;
          ts: number;
        };
        // 5분 이내 캐시만 신뢰 (한도/Pro 상태는 자주 바뀜)
        if (parsed.usage && Date.now() - parsed.ts < 5 * 60 * 1000) {
          setUsage(parsed.usage);
        }
      }
    } catch {
      // ignore
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiFetch(
        `/api/usage?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as UsageWithPro;
        const next: UsageWithPro = {
          persons: data.persons ?? 0,
          memos: data.memos ?? 0,
          pro: data.pro ?? false,
          proUntil: data.proUntil ?? null,
        };
        setUsage(next);
        try {
          localStorage.setItem(
            `membar_usage_cache_${userId}`,
            JSON.stringify({ usage: next, ts: Date.now() })
          );
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { usage, loading, refresh };
}
