"use client";

import { useEffect, useRef, useState } from "react";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { useRotatingText } from "@/lib/useRotatingText";

const LOADING_STEPS = [
  "메모 읽는 중…",
  "이름 찾는 중…",
  "관심사·태그 뽑는 중…",
  "기존 기록과 합치는 중…",
  "저장 중…",
] as const;

type Props = {
  title: string;
  placeholder?: string;
  initial?: string;
  examples?: string[];
  memosUsed?: number;
  memoLimit?: number;
  memoWarnAt?: number;
  error?: string | null;
  submitting?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
  onClose: () => void;
  onUpgrade?: () => void;
};

export default function InputModal({
  title,
  placeholder,
  initial = "",
  examples,
  memosUsed,
  memoLimit,
  memoWarnAt,
  error,
  submitting = false,
  onSubmit,
  onClose,
  onUpgrade,
}: Props) {
  useLockBodyScroll();
  const [text, setText] = useState(initial);
  const loadingStep = useRotatingText(LOADING_STEPS, 1700, submitting);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 40);
    return () => clearTimeout(t);
  }, []);

  // 메모창 열림 알림 (1회 — 마운트 시점)
  useEffect(() => {
    void fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "memo_open", detail: title }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const atMemoLimit =
    memoLimit !== undefined &&
    memosUsed !== undefined &&
    memosUsed >= memoLimit;
  const memoRemaining =
    memoLimit !== undefined && memosUsed !== undefined
      ? Math.max(0, memoLimit - memosUsed)
      : undefined;
  const showMemoWarn =
    memoWarnAt !== undefined &&
    memosUsed !== undefined &&
    memoLimit !== undefined &&
    memosUsed >= memoWarnAt &&
    memosUsed < memoLimit;

  const canSubmit = text.trim().length > 0 && !submitting && !atMemoLimit;

  const submit = async () => {
    if (!canSubmit) return;
    await onSubmit(text.trim());
  };

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up w-full max-w-[430px] rounded-t-2xl bg-surface p-5 pb-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[17px] font-bold text-paper">{title}</div>
          <button
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-full p-1.5 text-paper/55 transition hover:bg-paper/8"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder ?? "그냥 막 쳐요"}
          rows={5}
          disabled={atMemoLimit}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          className="w-full resize-none rounded-lg border border-paper/10 bg-surface p-3.5 text-[15px] leading-relaxed text-paper outline-none transition placeholder:text-paper/40 focus:border-gold disabled:opacity-60"
        />

        {atMemoLimit &&
          (onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-terra/30 bg-terra/8 px-3.5 py-2.5 text-left text-[12.5px] leading-relaxed text-terra transition hover:bg-terra/12"
            >
              <span className="min-w-0 flex-1">
                <span className="font-semibold">이번 달 메모가 가득 찼어요</span>{" "}
                <span className="text-paper/70">
                  · 월 4,990원부터 Pro 이용 가능
                </span>
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-terra"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <div className="mt-2 rounded-lg border border-terra/30 bg-terra/8 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-terra">
              <span className="font-semibold">이번 달 메모가 가득 찼어요</span>{" "}
              <span className="text-paper/70">· 월 4,990원부터 Pro 이용 가능</span>
            </div>
          ))}

        {!atMemoLimit && showMemoWarn && memoRemaining !== undefined && (
          <div className="mt-2 text-[12px] font-medium text-paper/60">
            이번 달 {memoRemaining}개 남았어요
          </div>
        )}

        {error && !atMemoLimit && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-terra/30 bg-terra/8 px-3.5 py-2.5 text-[13px] leading-relaxed text-terra">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="mt-[2px] shrink-0"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M12 8v5M12 16v.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {submitting ? (
          <div className="mt-3 rounded-lg border border-gold/30 bg-gold/8 px-3.5 py-3">
            <div className="flex items-center gap-3">
              <Spinner />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-paper">
                  {loadingStep}
                </div>
                <div className="mt-0.5 text-[12px] text-paper/55">
                  AI가 정리하고 있어요 · 보통 5~10초
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {LOADING_STEPS.map((_, i) => {
                const activeIdx = LOADING_STEPS.indexOf(
                  loadingStep as (typeof LOADING_STEPS)[number]
                );
                const done = i <= activeIdx;
                return (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      done ? "bg-gold" : "bg-paper/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          examples &&
          examples.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[12px] font-semibold text-paper/55">
                예시
              </div>
              <div className="flex flex-wrap gap-1.5">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setText(ex);
                      ref.current?.focus();
                    }}
                    className="rounded-md bg-paper/6 px-2.5 py-1.5 text-[12.5px] text-paper/70 transition hover:bg-paper/10 hover:text-paper"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12px] text-paper/50">
            ⌘ + Enter 로 저장
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 enabled:hover:bg-gold-soft"
          >
            {submitting && (
              <span className="inline-flex h-3 w-3 animate-spin rounded-full border-[1.75px] border-white/40 border-t-white" />
            )}
            {submitting ? "정리 중" : error ? "다시 시도" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="shrink-0 animate-spin text-gold"
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
