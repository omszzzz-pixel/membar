"use client";

import { useMemo, useState } from "react";
import type { HistoryEntry, Meeting } from "@/lib/types";

type Props = {
  meetings: Meeting[];
  history?: HistoryEntry[];
  onAddToday: () => void;
  onRemoveMeeting?: (date: string) => void;
  onRemoveMemo?: (id: string) => void;
};

type ActivityItem =
  | {
      key: string;
      kind: "meeting";
      date: string;
      sortKey: string;
      place?: string | null;
      notes?: string | null;
    }
  | {
      key: string;
      kind: "memo";
      id: string;
      date: string;
      time: string;
      sortKey: string;
      raw: string;
    };

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MeetingCalendar({
  meetings,
  history = [],
  onAddToday,
  onRemoveMeeting,
  onRemoveMemo,
}: Props) {
  const today = new Date();
  const todayKey = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState(() => ({
    y: today.getFullYear(),
    m: today.getMonth(),
  }));

  const meetingByDate = useMemo(() => {
    const map = new Map<string, Meeting>();
    for (const m of meetings ?? []) {
      if (m?.date) map.set(m.date, m);
    }
    return map;
  }, [meetings]);

  const memoDates = useMemo(() => {
    const set = new Set<string>();
    for (const h of history ?? []) {
      if (h?.created_at) set.add(h.created_at.slice(0, 10));
    }
    return set;
  }, [history]);

  const monthPrefix = `${view.y}-${String(view.m + 1).padStart(2, "0")}`;

  const monthActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    for (const m of meetings ?? []) {
      if (m.date?.startsWith(monthPrefix)) {
        items.push({
          key: `m-${m.date}`,
          kind: "meeting",
          date: m.date,
          sortKey: `${m.date}T12:00:00`,
          place: m.place,
          notes: m.notes,
        });
      }
    }
    for (const h of history ?? []) {
      const ds = h.created_at?.slice(0, 10);
      if (ds?.startsWith(monthPrefix)) {
        items.push({
          key: `h-${h.id}`,
          kind: "memo",
          id: h.id,
          date: ds,
          time: h.created_at.slice(11, 16),
          sortKey: h.created_at,
          raw: h.raw_input,
        });
      }
    }
    return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [meetings, history, monthPrefix]);

  const monthMeetingCount = monthActivity.filter(
    (a) => a.kind === "meeting"
  ).length;
  const monthMemoCount = monthActivity.filter((a) => a.kind === "memo").length;

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () =>
    setView(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const nextMonth = () =>
    setView(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  const alreadyToday = meetingByDate.has(todayKey);
  const totalThisYear = (meetings ?? []).filter((m) =>
    m.date?.startsWith(`${view.y}-`)
  ).length;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label="이전 달"
          className="flex h-8 w-8 items-center justify-center rounded-full text-paper/60 transition hover:bg-paper/8 hover:text-paper"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="text-[14.5px] font-bold tabular-nums tracking-tight text-paper">
          {view.y}.{String(view.m + 1).padStart(2, "0")}
        </div>
        <button
          onClick={nextMonth}
          aria-label="다음 달"
          className="flex h-8 w-8 items-center justify-center rounded-full text-paper/60 transition hover:bg-paper/8 hover:text-paper"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[11px] font-medium ${
              i === 0
                ? "text-terra/65"
                : i === 6
                ? "text-gold/70"
                : "text-paper/45"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="aspect-square" />;
          const key = ymd(view.y, view.m, d);
          const hasMeeting = meetingByDate.has(key);
          const hasMemo = memoDates.has(key);
          const isToday = key === todayKey;
          const isSunday = i % 7 === 0;
          const isSaturday = i % 7 === 6;
          return (
            <div
              key={i}
              className="relative flex aspect-square items-center justify-center"
            >
              <div
                className={`flex h-[72%] w-[72%] items-center justify-center rounded-full text-[13px] font-medium tabular-nums ${
                  isToday
                    ? "bg-paper/10 text-paper"
                    : hasMeeting
                    ? "text-paper"
                    : isSunday
                    ? "text-terra/70"
                    : isSaturday
                    ? "text-gold/70"
                    : "text-paper/65"
                }`}
              >
                {d}
              </div>
              {(hasMeeting || hasMemo) && (
                <div className="absolute bottom-[8%] flex items-center gap-[2px]">
                  {hasMeeting && (
                    <span className="h-[4px] w-[4px] rounded-full bg-gold" />
                  )}
                  {hasMemo && (
                    <span className="h-[4px] w-[4px] rounded-full bg-paper/35" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[12.5px]">
        <span className="min-w-0 flex-1 text-paper/55">
          {view.m + 1}월{" "}
          <span className="font-bold text-gold">{monthMeetingCount}</span>번
          만남
          {monthMemoCount > 0 && (
            <>
              {" "}
              · <span className="font-semibold text-paper/75">{monthMemoCount}</span>
              개 메모
            </>
          )}{" "}
          · 올해 <span className="font-bold text-paper/75">{totalThisYear}</span>
          번
        </span>
        {alreadyToday ? (
          <button
            onClick={() => onRemoveMeeting?.(todayKey)}
            disabled={!onRemoveMeeting}
            className="shrink-0 rounded-md bg-terra/10 px-3 py-1.5 text-[12.5px] font-semibold text-terra transition hover:bg-terra/18 disabled:opacity-40"
          >
            오늘 기록 취소
          </button>
        ) : (
          <button
            onClick={onAddToday}
            className="shrink-0 rounded-md bg-gold/12 px-3 py-1.5 text-[12.5px] font-semibold text-gold transition hover:bg-gold/18"
          >
            + 오늘 만났어요
          </button>
        )}
      </div>

      {monthActivity.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-paper/6 pt-3">
          {monthActivity.map((it) => (
            <li
              key={it.key}
              className="flex gap-2.5 rounded-lg border border-paper/8 bg-surface px-3 py-2.5"
            >
              <TypeChip kind={it.kind} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-[12px] font-medium tabular-nums text-paper/50">
                  <span>{it.date.slice(5).replace("-", ".")}</span>
                  {it.kind === "memo" && (
                    <span className="text-paper/40">{it.time}</span>
                  )}
                </div>
                <div className="mt-0.5 break-words text-[13.5px] text-paper/85">
                  {it.kind === "meeting" ? (
                    <>
                      {it.place && <span>{it.place}</span>}
                      {it.place && it.notes && (
                        <span className="mx-1.5 text-paper/35">·</span>
                      )}
                      {it.notes && (
                        <span className="text-paper/65">{it.notes}</span>
                      )}
                      {!it.place && !it.notes && (
                        <span className="text-paper/45">만남</span>
                      )}
                    </>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {it.raw}
                    </div>
                  )}
                </div>
              </div>
              {it.kind === "meeting" && onRemoveMeeting && (
                <button
                  onClick={() => onRemoveMeeting(it.date)}
                  aria-label="만남 기록 삭제"
                  className="shrink-0 self-start rounded-md p-1 text-paper/25 transition hover:bg-terra/10 hover:text-terra"
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
              )}
              {it.kind === "memo" && onRemoveMemo && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "이 메모를 삭제할까요?\n이미 반영된 정보(태그·관심사 등)는 그대로 남아있어요."
                      )
                    ) {
                      onRemoveMemo(it.id);
                    }
                  }}
                  aria-label="메모 삭제"
                  className="shrink-0 self-start rounded-md p-1 text-paper/25 transition hover:bg-terra/10 hover:text-terra"
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
              )}
            </li>
          ))}
        </ul>
      )}

      {monthActivity.length === 0 && (
        <div className="mt-3 rounded-lg bg-paper/4 px-4 py-4 text-center text-[12.5px] text-paper/50">
          이 달엔 기록 없음
        </div>
      )}
    </div>
  );
}

function TypeChip({ kind }: { kind: "meeting" | "memo" }) {
  if (kind === "meeting") {
    return (
      <span className="flex h-[22px] shrink-0 items-center rounded-md bg-gold/15 px-1.5 text-[11px] font-bold text-gold">
        만남
      </span>
    );
  }
  return (
    <span className="flex h-[22px] shrink-0 items-center rounded-md bg-paper/8 px-1.5 text-[11px] font-bold text-paper/65">
      메모
    </span>
  );
}
