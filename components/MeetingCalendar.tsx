"use client";

import { useMemo, useState } from "react";
import type { HistoryEntry, Meeting } from "@/lib/types";

type Props = {
  meetings: Meeting[];
  history?: HistoryEntry[];
  onAddToday: () => void;
  onRemoveMeeting?: (date: string) => void;
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
  const monthMeetings = useMemo(
    () =>
      (meetings ?? [])
        .filter((m) => m.date?.startsWith(monthPrefix))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [meetings, monthPrefix]
  );
  const monthMemoCount = useMemo(
    () =>
      (history ?? []).filter((h) =>
        h.created_at?.slice(0, 10).startsWith(monthPrefix)
      ).length,
    [history, monthPrefix]
  );

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
          {view.m + 1}월 <span className="font-bold text-gold">{monthMeetings.length}</span>번 만남
          {monthMemoCount > 0 && (
            <>
              {" "}
              · <span className="font-semibold text-paper/75">{monthMemoCount}</span>개 메모
            </>
          )}{" "}
          · 올해{" "}
          <span className="font-bold text-paper/75">{totalThisYear}</span>번
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

      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-paper/50">
        <span className="flex items-center gap-1">
          <span className="h-[4px] w-[4px] rounded-full bg-gold" /> 만남
        </span>
        <span className="flex items-center gap-1">
          <span className="h-[4px] w-[4px] rounded-full bg-paper/35" /> 메모 기록
        </span>
      </div>

      {monthMeetings.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-paper/6 pt-3">
          {monthMeetings.map((m) => (
            <li key={m.date} className="group flex items-center gap-2 text-[13.5px]">
              <span className="w-[42px] shrink-0 font-semibold tabular-nums text-paper/55">
                {m.date.slice(5).replace("-", ".")}
              </span>
              <div className="min-w-0 flex-1 text-paper/85">
                {m.place && <span>{m.place}</span>}
                {m.place && m.notes && (
                  <span className="mx-1.5 text-paper/35">·</span>
                )}
                {m.notes && (
                  <span className="text-paper/65">{m.notes}</span>
                )}
                {!m.place && !m.notes && (
                  <span className="text-paper/45">만남</span>
                )}
              </div>
              {onRemoveMeeting && (
                <button
                  onClick={() => onRemoveMeeting(m.date)}
                  aria-label="만남 기록 삭제"
                  className="shrink-0 rounded-md p-1 text-paper/30 transition hover:bg-terra/10 hover:text-terra"
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
    </div>
  );
}
