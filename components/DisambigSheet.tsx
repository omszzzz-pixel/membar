"use client";

import { useEffect } from "react";
import Avatar from "./Avatar";

export type Candidate = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  location: string | null;
  relationship: string | null;
  tags: string[];
  interests: string[];
  is_favorite: boolean;
  last_updated_at: string;
};

type Props = {
  parsedName: string;
  input: string;
  candidates: Candidate[];
  onPick: (id: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
};

function formatRelDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "오늘";
  if (diff < 2 * day) return "어제";
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (y === new Date().getFullYear()) return `${m}.${dd}`;
  return `${y}.${m}.${dd}`;
}

export default function DisambigSheet({
  parsedName,
  input,
  candidates,
  onPick,
  onCreateNew,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[65] flex items-end justify-center bg-black/50 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up flex w-full max-w-[430px] max-h-[88dvh] flex-col rounded-t-2xl bg-surface sm:rounded-2xl">
        <div className="flex items-start justify-between px-5 pb-3 pt-5">
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-bold text-paper">
              “{parsedName}”이(가) {candidates.length}명 있어요
            </div>
            <div className="mt-1 text-[13px] text-paper/65">
              어떤 분에 대한 기록인지 골라주세요.
            </div>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 -mt-1 shrink-0 rounded-lg p-2 text-paper/55 transition hover:bg-paper/8"
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

        <div className="mx-5 rounded-lg bg-paper/5 px-3.5 py-2.5">
          <div className="text-[11.5px] font-semibold text-paper/55">
            내가 쓴 메모
          </div>
          <div className="mt-0.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-paper/85">
            {input}
          </div>
        </div>

        <ul className="mt-3 flex-1 space-y-2 overflow-y-auto px-5 pb-3 scrollbar-none">
          {candidates.map((c) => {
            const subtitle = [c.title, c.company, c.location]
              .filter(Boolean)
              .join(" · ");
            const chips = [...(c.interests ?? []), ...(c.tags ?? [])]
              .slice(0, 3);
            return (
              <li key={c.id}>
                <button
                  onClick={() => onPick(c.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-paper/10 bg-surface px-3.5 py-3 text-left transition hover:border-gold/50 hover:bg-gold/4 active:bg-paper/4"
                >
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex min-w-0 items-baseline gap-1.5">
                        <span className="truncate text-[15px] font-bold text-paper">
                          {c.name}
                        </span>
                        {c.is_favorite && (
                          <span className="text-[11px] text-gold">★</span>
                        )}
                        {c.relationship && (
                          <span className="truncate text-[12.5px] font-medium text-paper/55">
                            · {c.relationship}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-paper/45">
                        {formatRelDate(c.last_updated_at)}
                      </span>
                    </div>
                    {subtitle && (
                      <div className="mt-0.5 truncate text-[12.5px] text-paper/65">
                        {subtitle}
                      </div>
                    )}
                    {chips.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {chips.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-paper/6 px-1.5 py-[2px] text-[11.5px] font-medium text-paper/70"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-paper/8 px-5 py-3">
          <button
            onClick={onCreateNew}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-paper/25 py-3 text-[13.5px] font-semibold text-paper/75 transition hover:border-gold/45 hover:text-gold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            새로운 {parsedName}(으)로 등록
          </button>
        </div>
      </div>
    </div>
  );
}
