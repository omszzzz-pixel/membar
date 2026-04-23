"use client";

import Avatar from "./Avatar";
import { STALE_DAYS, type Person } from "@/lib/types";
import { isSample } from "@/lib/sampleData";

type Props = {
  person: Person;
  onClick: () => void;
};

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function formatRelDate(iso: string) {
  const days = daysBetween(iso);
  if (days < 1) return "오늘";
  if (days < 2) return "어제";
  if (days < 7) return `${days}일 전`;
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (y === new Date().getFullYear()) return `${m}.${dd}`;
  return `${y}.${m}.${dd}`;
}

export default function PersonCard({ person, onClick }: Props) {
  const subtitle = [person.title, person.company].filter(Boolean).join(" · ");
  const topTags = (person.tags ?? []).slice(0, 3);
  const sample = isSample(person.id);
  const daysSince = daysBetween(person.last_updated_at);
  const isStale = !sample && daysSince >= STALE_DAYS;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-paper/10 bg-surface px-4 py-3.5 text-left transition hover:border-paper/20 active:bg-paper/4"
    >
      <Avatar name={person.name} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <div className="truncate text-[16px] font-bold text-paper">
              {person.name}
            </div>
            {isStale && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-terra"
                aria-label="오래된 인연"
              />
            )}
            {sample && (
              <span className="shrink-0 rounded bg-gold/12 px-1.5 py-[1px] text-[10.5px] font-semibold text-gold">
                예시
              </span>
            )}
            {person.is_favorite && (
              <span className="text-[12px] text-gold">★</span>
            )}
            {person.relationship && (
              <span className="truncate text-[13px] font-medium text-paper/55">
                · {person.relationship}
              </span>
            )}
          </div>
          <div
            className={`shrink-0 text-[12px] font-medium tabular-nums ${
              isStale ? "text-terra" : "text-paper/50"
            }`}
          >
            {isStale
              ? `${daysSince}일째 연락 없음`
              : formatRelDate(person.last_updated_at)}
          </div>
        </div>

        {subtitle && (
          <div className="mt-0.5 truncate text-[13px] text-paper/65">
            {subtitle}
          </div>
        )}

        {topTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {topTags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-paper/6 px-2 py-[2px] text-[12px] font-medium text-paper/70"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
