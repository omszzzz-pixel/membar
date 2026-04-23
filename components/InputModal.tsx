"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  placeholder?: string;
  initial?: string;
  examples?: string[];
  memosUsed?: number;
  memoLimit?: number;
  memoWarnAt?: number;
  submitting?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
  onClose: () => void;
};

export default function InputModal({
  title,
  placeholder,
  initial = "",
  examples,
  memosUsed,
  memoLimit,
  memoWarnAt,
  submitting = false,
  onSubmit,
  onClose,
}: Props) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 40);
    return () => clearTimeout(t);
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

        {atMemoLimit && (
          <div className="mt-2 rounded-lg border border-terra/30 bg-terra/8 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-terra">
            <span className="font-semibold">이번 달 메모가 가득 찼어요</span>{" "}
            <span className="text-paper/70">· 월 4,990원부터 Pro 이용 가능</span>
          </div>
        )}

        {!atMemoLimit && showMemoWarn && memoRemaining !== undefined && (
          <div className="mt-2 text-[12px] font-medium text-paper/60">
            이번 달 {memoRemaining}개 남았어요
          </div>
        )}

        {examples && examples.length > 0 && (
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
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12px] text-paper/50">
            ⌘ + Enter 로 저장
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-lg bg-gold px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-gold-soft"
          >
            {submitting ? "정리 중…" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
