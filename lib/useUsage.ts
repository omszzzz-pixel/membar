"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usage } from "./types";
import { apiFetch } from "./apiFetch";

type UsageWithPro = Usage & { pro: boolean; proUntil: string | null };

export function useUsage(userId: string) {
  const [usage, setUsage] = useState<UsageWithPro>({
    persons: 0,
    memos: 0,
    pro: false,
    proUntil: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiFetch(
        `/api/usage?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as UsageWithPro;
        setUsage({
          persons: data.persons ?? 0,
          memos: data.memos ?? 0,
          pro: data.pro ?? false,
          proUntil: data.proUntil ?? null,
        });
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
