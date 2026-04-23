"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import PersonDetail from "@/components/PersonDetail";
import BriefingSheet from "@/components/BriefingSheet";
import { useUser } from "@/lib/userContext";
import { STALE_DAYS, type HistoryEntry, type Person, type Todo } from "@/lib/types";
import { SAMPLE_HISTORY, SAMPLE_PERSONS, isSample } from "@/lib/sampleData";

const TODAY_MEETING_WINDOW_DAYS = 1;
const THIS_WEEK_WINDOW_DAYS = 7;
const READ_STORAGE_KEY = "membar_notif_read";

type NotifBase = {
  key: string;
  person: Person;
};

type MeetingNotif = NotifBase & {
  kind: "meeting";
  date: string;
  place?: string | null;
  notes?: string | null;
};

type TodoNotif = NotifBase & {
  kind: "todo";
  todoIdx: number;
  text: string;
  ageDays: number;
};

type StaleNotif = NotifBase & {
  kind: "stale";
  daysSince: number;
};

type Notif = MeetingNotif | TodoNotif | StaleNotif;

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function loadReadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const obj = JSON.parse(raw) as Record<string, number>;
    return new Set(Object.keys(obj));
  } catch {
    return new Set();
  }
}

function markRead(key: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    const obj = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    obj[key] = Date.now();
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

export default function NotificationsPage() {
  const { userId, loading: userLoading } = useUser();
  const [persons, setPersons] = useState<Person[] | null>(null);
  const [selected, setSelected] = useState<Person | null>(null);
  const [briefingFor, setBriefingFor] = useState<{
    person: Person;
    history: HistoryEntry[];
  } | null>(null);
  const [readSet, setReadSet] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setReadSet(loadReadSet());
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const res = await fetch(
        `/api/persons?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { persons: Person[] };
      setPersons(data.persons);
    })();
  }, [userId]);

  const todayKey = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );
  const tomorrowKey = useMemo(
    () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
    []
  );
  const weekHorizon = useMemo(
    () =>
      new Date(Date.now() + THIS_WEEK_WINDOW_DAYS * 86_400_000)
        .toISOString()
        .slice(0, 10),
    []
  );

  const showingSamples = persons !== null && persons.length === 0;
  const effectivePersons = showingSamples ? SAMPLE_PERSONS : persons ?? [];

  const { todayNotifs, weekNotifs } = useMemo(() => {
    const today: Notif[] = [];
    const week: Notif[] = [];

    for (const p of effectivePersons) {
      // Upcoming meetings
      for (const m of p.meetings ?? []) {
        if (!m.date) continue;
        if (m.date < todayKey) continue;
        const notif: MeetingNotif = {
          kind: "meeting",
          key: `meeting-${p.id}-${m.date}`,
          person: p,
          date: m.date,
          place: m.place,
          notes: m.notes,
        };
        if (m.date <= tomorrowKey) today.push(notif);
        else if (m.date <= weekHorizon) week.push(notif);
      }

      // Overdue todos (older than 3 days, not done) = "today" bucket
      (p.todos ?? []).forEach((t: Todo, idx) => {
        if (t.done) return;
        const age = daysBetween(t.created_at);
        if (age < 3) return;
        today.push({
          kind: "todo",
          key: `todo-${p.id}-${idx}`,
          person: p,
          todoIdx: idx,
          text: t.text,
          ageDays: age,
        });
      });

      // Stale contacts (30일+) → 이번 주 bucket
      const daysSince = daysBetween(p.last_updated_at);
      if (daysSince >= STALE_DAYS) {
        week.push({
          kind: "stale",
          key: `stale-${p.id}`,
          person: p,
          daysSince,
        });
      }
    }

    today.sort((a, b) => a.key.localeCompare(b.key));
    week.sort((a, b) => a.key.localeCompare(b.key));

    return { todayNotifs: today, weekNotifs: week };
  }, [effectivePersons, todayKey, tomorrowKey, weekHorizon]);

  const unreadTotal = useMemo(
    () =>
      [...todayNotifs, ...weekNotifs].filter((n) => !readSet.has(n.key))
        .length,
    [todayNotifs, weekNotifs, readSet]
  );

  const handleOpenNotif = useCallback(
    async (n: Notif) => {
      if (!readSet.has(n.key)) {
        markRead(n.key);
        setReadSet((prev) => {
          const next = new Set(prev);
          next.add(n.key);
          return next;
        });
      }

      if (n.kind === "meeting") {
        if (isSample(n.person.id)) {
          setBriefingFor({
            person: n.person,
            history: SAMPLE_HISTORY[n.person.id] ?? [],
          });
          return;
        }
        try {
          const res = await fetch(
            `/api/persons/history?personId=${n.person.id}&userId=${encodeURIComponent(userId)}`,
            { cache: "no-store" }
          );
          const data = res.ok
            ? ((await res.json()) as { history: HistoryEntry[] })
            : { history: [] };
          setBriefingFor({ person: n.person, history: data.history ?? [] });
        } catch {
          setBriefingFor({ person: n.person, history: [] });
        }
      } else {
        setSelected(n.person);
      }
    },
    [userId, readSet]
  );

  const markAllRead = () => {
    for (const n of [...todayNotifs, ...weekNotifs]) {
      if (!readSet.has(n.key)) markRead(n.key);
    }
    setReadSet(loadReadSet());
  };

  const loading = userLoading || persons === null;

  return (
    <main className="relative min-h-dvh pb-24">
      <header className="sticky top-0 z-10 border-b border-paper/8 bg-ink px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-paper">알림</h1>
            <div className="mt-0.5 text-[12.5px] text-paper/55">
              {unreadTotal > 0
                ? `읽지 않음 ${unreadTotal}개`
                : "모두 확인했어요"}
            </div>
          </div>
          {unreadTotal > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-md bg-paper/6 px-2.5 py-1.5 text-[12.5px] font-semibold text-paper/70 transition hover:bg-paper/10"
            >
              모두 읽음
            </button>
          )}
        </div>
      </header>

      {loading && (
        <div className="px-4 pt-12 text-center text-[14px] text-paper/50">
          불러오는 중
        </div>
      )}

      {!loading && (
        <div className="px-4 pt-4">
          {showingSamples && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-gold/25 bg-gold/8 px-3.5 py-3">
              <span className="mt-[2px] shrink-0 rounded bg-gold/20 px-1.5 py-[1px] text-[10.5px] font-semibold text-gold">
                예시
              </span>
              <div className="text-[12.5px] leading-relaxed text-paper/75">
                실제 기록이 없어서 예시로 보여드리는 알림이에요. 홈에서 메모를
                등록하면 여기 진짜 알림이 올라와요.
              </div>
            </div>
          )}
          <Section
            title="오늘"
            count={todayNotifs.length}
            unread={todayNotifs.filter((n) => !readSet.has(n.key)).length}
          >
            {todayNotifs.length === 0 ? (
              <Empty>오늘 챙길 거 없음</Empty>
            ) : (
              <ul className="space-y-2">
                {todayNotifs.map((n) => (
                  <NotifItem
                    key={n.key}
                    n={n}
                    unread={!readSet.has(n.key)}
                    onClick={() => handleOpenNotif(n)}
                  />
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="이번 주"
            count={weekNotifs.length}
            unread={weekNotifs.filter((n) => !readSet.has(n.key)).length}
          >
            {weekNotifs.length === 0 ? (
              <Empty>이번 주 조용해요</Empty>
            ) : (
              <ul className="space-y-2">
                {weekNotifs.map((n) => (
                  <NotifItem
                    key={n.key}
                    n={n}
                    unread={!readSet.has(n.key)}
                    onClick={() => handleOpenNotif(n)}
                  />
                ))}
              </ul>
            )}
          </Section>

          <Section title="생일" count={0}>
            <Empty>
              생일 알림은 추후 지원 예정. 지금은 메모에 "생일 8월 14일"처럼
              적어두면 기록돼요.
            </Empty>
          </Section>
        </div>
      )}

      {selected && (
        <PersonDetail
          person={selected}
          userId={userId}
          onClose={() => setSelected(null)}
          onEdit={() => setSelected(null)}
          onDelete={() => setSelected(null)}
          onUpdate={(u) => {
            setPersons((prev) =>
              prev ? prev.map((p) => (p.id === u.id ? u : p)) : prev
            );
            setSelected(u);
          }}
        />
      )}

      {briefingFor && (
        <BriefingSheet
          person={briefingFor.person}
          history={briefingFor.history}
          onClose={() => setBriefingFor(null)}
        />
      )}
    </main>
  );
}

function NotifItem({
  n,
  unread,
  onClick,
}: {
  n: Notif;
  unread: boolean;
  onClick: () => void;
}) {
  let top: string;
  let bottom: string;
  let accent: "gold" | "terra" | "paper" = "paper";

  if (n.kind === "meeting") {
    accent = "gold";
    top = `${n.person.name} · 만남 예정`;
    bottom = `${formatMeetingDate(n.date)}${n.place ? ` · ${n.place}` : ""}`;
  } else if (n.kind === "todo") {
    accent = "gold";
    top = `${n.person.name} · 챙길 것`;
    bottom = `${n.text} · ${n.ageDays}일째`;
  } else {
    accent = "terra";
    top = `${n.person.name}`;
    bottom = `${n.daysSince}일 동안 기록 없음`;
  }

  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-start gap-3 rounded-lg border border-paper/10 bg-surface px-3.5 py-3 text-left transition hover:border-paper/20"
      >
        <div className="relative shrink-0">
          <Avatar name={n.person.name} size="sm" />
          {unread && (
            <span
              className={`absolute right-[-2px] top-[-2px] h-2.5 w-2.5 rounded-full ring-2 ring-surface ${
                accent === "gold"
                  ? "bg-gold"
                  : accent === "terra"
                  ? "bg-terra"
                  : "bg-paper/40"
              }`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-paper">
            {top}
          </div>
          <div className="mt-0.5 truncate text-[12.5px] text-paper/60">
            {bottom}
          </div>
        </div>
        {n.kind === "meeting" && (
          <span className="shrink-0 self-center rounded-md bg-gold/12 px-2 py-1 text-[11.5px] font-semibold text-gold">
            브리핑
          </span>
        )}
      </button>
    </li>
  );
}

function formatMeetingDate(date: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (date === today) return "오늘";
  if (date === tomorrow) return "내일";
  const d = new Date(date);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function Section({
  title,
  count,
  unread,
  children,
}: {
  title: string;
  count: number;
  unread?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-2">
      <div className="mb-2.5 flex items-baseline gap-1.5">
        <h2 className="text-[15px] font-bold text-paper">{title}</h2>
        <span className="text-[13px] font-medium tabular-nums text-paper/50">
          {count}
        </span>
        {unread !== undefined && unread > 0 && (
          <span className="rounded-full bg-gold px-1.5 py-[1px] text-[10.5px] font-bold text-white">
            {unread}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-paper/4 px-4 py-5 text-center text-[13px] leading-relaxed text-paper/55">
      {children}
    </div>
  );
}
