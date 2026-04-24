"use client";

import { useEffect, useMemo, useState } from "react";
import type { TimelineItem } from "@/lib/types";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { getSampleTimelineItems } from "@/lib/sampleData";
import { apiFetch } from "@/lib/apiFetch";

type Props = {
  userId: string;
  onClose: () => void;
  onPersonClick: (personId: string) => void;
};

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDayLabel(key: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (key === today) return "오늘";
  if (key === yesterday) return "어제";
  const d = new Date(key);
  return d.toLocaleDateString("ko-KR", {
    year:
      d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function TimelineSheet({
  userId,
  onClose,
  onPersonClick,
}: Props) {
  useLockBodyScroll();
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(
          `/api/timeline?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "불러오기 실패");
        setItems(data.items ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "실패");
          setItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const showingSamples = items !== null && items.length === 0;
  const effectiveItems = showingSamples ? getSampleTimelineItems() : items ?? [];

  const groups = useMemo<[string, TimelineItem[]][]>(() => {
    if (effectiveItems.length === 0) return [];
    const m = new Map<string, TimelineItem[]>();
    for (const it of effectiveItems) {
      const k = dayKey(it.created_at);
      const arr = m.get(k) ?? [];
      arr.push(it);
      m.set(k, arr);
    }
    return Array.from(m.entries());
  }, [effectiveItems]);

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-2xl bg-surface">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <div className="text-[18px] font-bold text-paper">
              기록 타임라인
            </div>
            <div className="mt-0.5 text-[12.5px] text-paper/55">
              전체 인맥 · 최근 200건
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-paper/60 transition hover:bg-paper/8 hover:text-paper"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="h-px bg-paper/8" />

        <div className="overflow-y-auto px-5 pb-6 pt-4 scrollbar-none">
          {items === null && (
            <div className="pt-10 text-center text-[14px] font-medium text-paper/50">
              불러오는 중
            </div>
          )}

          {items !== null && (
            <div>
              {showingSamples && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-gold/25 bg-gold/8 px-3.5 py-3">
                  <span className="mt-[2px] shrink-0 rounded bg-gold/20 px-1.5 py-[1px] text-[10.5px] font-semibold text-gold">
                    예시
                  </span>
                  <div className="text-[12.5px] leading-relaxed text-paper/75">
                    실제 기록이 없어서 예시 타임라인을 보여드려요. 홈에서 메모를
                    등록하면 여기에 진짜 기록이 쌓여요.
                  </div>
                </div>
              )}
              {groups.map(([day, dayItems]) => (
                <div key={day} className="mb-5 last:mb-0">
                  <div className="sticky top-0 z-[1] -mx-5 bg-surface px-5 py-1.5">
                    <div className="text-[13px] font-bold text-paper">
                      {formatDayLabel(day)}
                    </div>
                  </div>

                  <ul className="mt-2 space-y-2">
                    {dayItems.map((it) => (
                      <li key={it.id}>
                        <button
                          onClick={() => onPersonClick(it.person_id)}
                          className="block w-full rounded-lg border border-paper/8 bg-surface px-4 py-3 text-left transition hover:border-paper/16 active:bg-paper/4"
                        >
                          <div className="flex items-center gap-1.5 text-[13.5px]">
                            <span className="font-semibold text-paper">
                              {it.person_name}
                            </span>
                            {it.person_favorite && (
                              <span className="text-[11px] text-gold">
                                ★
                              </span>
                            )}
                            <span className="ml-auto text-[12px] font-medium tabular-nums text-paper/50">
                              {formatTime(it.created_at)}
                            </span>
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-paper/85">
                            {it.raw_input}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
