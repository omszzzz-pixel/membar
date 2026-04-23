"use client";

import { useCallback, useEffect, useState } from "react";
import Avatar from "./Avatar";
import type { Briefing, HistoryEntry, Person } from "@/lib/types";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { useRotatingText } from "@/lib/useRotatingText";
import { SAMPLE_BRIEFINGS, isSample } from "@/lib/sampleData";

const BRIEFING_STEPS = [
  "히스토리 읽는 중…",
  "최근 대화 정리 중…",
  "이번에 꺼낼 얘깃거리 찾는 중…",
  "챙길 것 모으는 중…",
  "브리핑 만드는 중…",
] as const;

type Props = {
  person: Person;
  history: HistoryEntry[];
  onClose: () => void;
};

export default function BriefingSheet({ person, history, onClose }: Props) {
  useLockBodyScroll();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingStep = useRotatingText(BRIEFING_STEPS, 1800, loading);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);

    // For sample persons, use pre-crafted briefings (instant, no API cost).
    if (isSample(person.id)) {
      const sampleBriefing = SAMPLE_BRIEFINGS[person.id];
      if (sampleBriefing) {
        // Small delay to show the loading animation briefly — feels natural.
        await new Promise((r) => setTimeout(r, 900));
        setBriefing(sampleBriefing);
        setLoading(false);
        return;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ person, history }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON
      }

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("AI 서버가 바빠요. 잠시 후 다시 시도해주세요.");
        }
        if (res.status >= 500) {
          throw new Error("서버 오류. 잠시 후 다시 시도해주세요.");
        }
        throw new Error(
          (data as { error?: string }).error || "브리핑 생성 실패"
        );
      }
      setBriefing((data as { briefing: Briefing }).briefing);
    } catch (e) {
      clearTimeout(timeoutId);
      if ((e as Error)?.name === "AbortError") {
        setError("응답이 너무 늦어요. 네트워크 확인 후 다시 시도해주세요.");
      } else {
        setError(e instanceof Error ? e.message : "실패");
      }
    } finally {
      setLoading(false);
    }
  }, [person, history]);

  useEffect(() => {
    void generate();
  }, [generate]);

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-2xl bg-surface">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <Avatar name={person.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-gold">
              만남 전 브리핑
            </div>
            <div className="mt-0.5 text-[18px] font-bold text-paper">
              {person.name}
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
          {loading && (
            <div className="mt-2 flex flex-col items-center gap-4 py-10">
              <Spinner />
              <div className="text-center">
                <div className="text-[15px] font-semibold text-paper">
                  {loadingStep}
                </div>
                <div className="mt-1 text-[12.5px] text-paper/55">
                  보통 5~10초 정도 걸려요
                </div>
              </div>
              <div className="mt-1 flex gap-1.5">
                {BRIEFING_STEPS.map((_, i) => {
                  const activeIdx = BRIEFING_STEPS.indexOf(
                    loadingStep as (typeof BRIEFING_STEPS)[number]
                  );
                  const done = i <= activeIdx;
                  return (
                    <span
                      key={i}
                      className={`h-1 w-6 rounded-full transition-colors ${
                        done ? "bg-gold" : "bg-paper/10"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="mt-4 rounded-lg border border-terra/30 bg-terra/8 px-4 py-3.5 text-[14px] text-terra">
              <div className="font-semibold">브리핑 생성 실패</div>
              <div className="mt-1 text-paper/70">{error}</div>
              <button
                onClick={generate}
                className="mt-2 rounded-md bg-terra/15 px-3 py-1.5 text-[13px] font-semibold text-terra hover:bg-terra/25"
              >
                다시 시도
              </button>
            </div>
          )}

          {briefing && !loading && (
            <>
              {briefing.recent_context && (
                <BSection title="최근 상황" accent>
                  <p className="text-[15px] leading-relaxed text-paper/90">
                    {briefing.recent_context}
                  </p>
                </BSection>
              )}

              {briefing.last_conversations?.length > 0 && (
                <BSection title="지난번 핵심 대화">
                  <BList items={briefing.last_conversations} />
                </BSection>
              )}

              {briefing.topics_to_mention?.length > 0 && (
                <BSection title="이번에 꺼낼 얘기" accent>
                  <BList items={briefing.topics_to_mention} accent />
                </BSection>
              )}

              {briefing.followups?.length > 0 && (
                <BSection title="챙길 것">
                  <BList items={briefing.followups} />
                </BSection>
              )}

              {briefing.sensitivities?.length > 0 && (
                <BSection title="주의·배려">
                  <div className="rounded-lg border border-terra/20 bg-terra/5 p-3.5">
                    <BList items={briefing.sensitivities} />
                  </div>
                </BSection>
              )}

              {!briefing.recent_context &&
                briefing.last_conversations?.length === 0 &&
                briefing.topics_to_mention?.length === 0 &&
                briefing.followups?.length === 0 &&
                briefing.sensitivities?.length === 0 && (
                  <div className="mt-6 text-center text-[14px] text-paper/55">
                    아직 브리핑할 정보가 부족해요. <br />
                    몇 번 기록을 쌓으면 더 좋아져요.
                  </div>
                )}
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-paper/8 bg-surface px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-paper/6 px-4 py-3 text-[14px] font-medium text-paper/75 transition hover:bg-paper/10"
          >
            닫기
          </button>
          <button
            onClick={generate}
            disabled={loading}
            className="flex-1 rounded-lg bg-gold/12 py-3 text-[14px] font-semibold text-gold transition hover:bg-gold/18 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "생성 중…" : "다시 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BSection({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <div
        className={`mb-2 text-[13.5px] font-bold ${
          accent ? "text-gold" : "text-paper"
        }`}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function BList({ items, accent = false }: { items: string[]; accent?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex gap-2 text-[14.5px] leading-relaxed text-paper/85"
        >
          <span
            className={`mt-[8px] h-[4px] w-[4px] shrink-0 rounded-full ${
              accent ? "bg-gold" : "bg-paper/40"
            }`}
          />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin text-gold"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
