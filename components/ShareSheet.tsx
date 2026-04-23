"use client";

import { useEffect, useState } from "react";

type Props = {
  title: string;
  text: string;
  onClose: () => void;
};

export default function ShareSheet({ title, text, onClose }: Props) {
  const [value, setValue] = useState(text);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("복사 실패");
    }
  };

  const share = async () => {
    if (canShare) {
      try {
        await navigator.share({ text: value, title });
      } catch {
        // user cancelled — ignore
      }
    } else {
      await copy();
    }
  };

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up w-full max-w-[430px] rounded-t-2xl bg-surface p-5 pb-5 sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-[17px] font-bold text-paper">{title}</div>
            <div className="mt-1 text-[12.5px] text-paper/55">
              편집해서 카톡·메시지로 공유
            </div>
          </div>
          <button
            onClick={onClose}
            className="-mt-1 -mr-2 rounded-lg p-2 text-paper/60 transition hover:bg-paper/8"
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

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={11}
          className="w-full resize-none rounded-lg border border-paper/10 bg-surface p-3.5 text-[14px] leading-relaxed text-paper outline-none transition focus:border-gold"
        />

        <div className="mt-3 flex gap-2">
          <button
            onClick={copy}
            className="flex-1 rounded-lg bg-paper/6 py-3 text-[14px] font-medium text-paper/80 transition hover:bg-paper/10"
          >
            {copied ? "복사됨 ✓" : "복사"}
          </button>
          <button
            onClick={share}
            className="flex-1 rounded-lg bg-gold py-3 text-[14px] font-semibold text-white transition hover:bg-gold-soft"
          >
            {canShare ? "공유" : "복사"}
          </button>
        </div>
      </div>
    </div>
  );
}
