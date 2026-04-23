"use client";

import { useEffect } from "react";
import Avatar from "./Avatar";

const AUTO_DISMISS_MS = 3200;

type Props = {
  name: string;
  kind: "new" | "updated";
  onClose: () => void;
};

export default function SaveToast({ name, kind, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  const title =
    kind === "new" ? `${name} 새로 추가됨` : `${name} 업데이트됨`;
  const sub =
    kind === "new"
      ? "인맥에 등록됐어요"
      : "메모가 반영됐어요";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-40 mx-auto flex max-w-[430px] justify-center px-4">
      <div className="anim-sheet-up pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-paper/12 bg-surface px-4 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)]">
        <Avatar name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-paper">
            {title}
          </div>
          <div className="text-[12px] text-paper/60">{sub}</div>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-[3px] text-[11px] font-bold ${
            kind === "new"
              ? "bg-gold/15 text-gold"
              : "bg-paper/8 text-paper/70"
          }`}
        >
          ✓
        </span>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="shrink-0 rounded-full p-1 text-paper/40 transition hover:bg-paper/10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
