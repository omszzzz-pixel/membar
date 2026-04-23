"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import PersonDetail from "@/components/PersonDetail";
import { useUser } from "@/lib/userContext";
import { STALE_DAYS, type Person } from "@/lib/types";
import { SAMPLE_PERSONS } from "@/lib/sampleData";

type UpcomingMeeting = {
  person: Person;
  date: string;
  place?: string | null;
  notes?: string | null;
};

type PendingTodo = {
  person: Person;
  idx: number;
  text: string;
  created_at: string;
};

export default function SchedulePage() {
  const { userId, loading: userLoading } = useUser();
  const [persons, setPersons] = useState<Person[] | null>(null);
  const [selected, setSelected] = useState<Person | null>(null);

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

  const showingSamples = persons !== null && persons.length === 0;
  const effectivePersons = showingSamples ? SAMPLE_PERSONS : persons ?? [];

  const todayKey = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const upcoming = useMemo<UpcomingMeeting[]>(() => {
    const out: UpcomingMeeting[] = [];
    for (const p of effectivePersons) {
      for (const m of p.meetings ?? []) {
        if (m.date >= todayKey) {
          out.push({
            person: p,
            date: m.date,
            place: m.place,
            notes: m.notes,
          });
        }
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [effectivePersons, todayKey]);

  const pendingTodos = useMemo<PendingTodo[]>(() => {
    const out: PendingTodo[] = [];
    for (const p of effectivePersons) {
      (p.todos ?? []).forEach((t, idx) => {
        if (!t.done) {
          out.push({
            person: p,
            idx,
            text: t.text,
            created_at: t.created_at,
          });
        }
      });
    }
    return out.sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
  }, [effectivePersons]);

  const stale = useMemo<Person[]>(() => {
    const threshold = Date.now() - STALE_DAYS * 86_400_000;
    return effectivePersons
      .filter(
        (p) => new Date(p.last_updated_at).getTime() < threshold
      )
      .sort(
        (a, b) =>
          new Date(a.last_updated_at).getTime() -
          new Date(b.last_updated_at).getTime()
      );
  }, [effectivePersons]);

  const loading = userLoading || persons === null;

  return (
    <main className="relative min-h-dvh pb-24">
      <header className="sticky top-0 z-10 border-b border-paper/8 bg-ink px-4 pb-3 pt-4">
        <h1 className="text-[20px] font-bold text-paper">일정</h1>
        <div className="mt-0.5 text-[12.5px] text-paper/55">
          다가오는 만남 · 챙길 것 · 오래된 인연
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
                실제 기록이 없어서 예시로 보여드리는 화면이에요. 홈에서
                메모를 등록하면 여기 진짜 데이터로 채워져요.
              </div>
            </div>
          )}
          <Section title="다가오는 만남" count={upcoming.length}>
            {upcoming.length === 0 ? (
              <Empty>예정된 만남 없음</Empty>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((u, i) => (
                  <li key={`${u.person.id}-${u.date}-${i}`}>
                    <button
                      onClick={() => setSelected(u.person)}
                      className="flex w-full items-center gap-3 rounded-lg border border-paper/10 bg-surface px-3.5 py-3 text-left transition hover:border-paper/20"
                    >
                      <DateBadge date={u.date} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-semibold text-paper">
                          {u.person.name}
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px] text-paper/60">
                          {[u.place, u.notes].filter(Boolean).join(" · ") ||
                            "만남"}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="챙길 것" count={pendingTodos.length}>
            {pendingTodos.length === 0 ? (
              <Empty>완료되지 않은 할 일 없음</Empty>
            ) : (
              <ul className="space-y-2">
                {pendingTodos.slice(0, 30).map((t, i) => (
                  <li key={`${t.person.id}-${t.idx}-${i}`}>
                    <button
                      onClick={() => setSelected(t.person)}
                      className="flex w-full items-start gap-3 rounded-lg border border-paper/10 bg-surface px-3.5 py-3 text-left transition hover:border-paper/20"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] text-paper/90 leading-relaxed">
                          {t.text}
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-paper/50">
                          {t.person.name}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="오래된 인연" count={stale.length} subtitle={`${STALE_DAYS}일 이상`}>
            {stale.length === 0 ? (
              <Empty>모두 최근에 챙겼어요</Empty>
            ) : (
              <ul className="space-y-2">
                {stale.slice(0, 20).map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelected(p)}
                      className="flex w-full items-center gap-3 rounded-lg border border-paper/10 bg-surface px-3.5 py-3 text-left transition hover:border-paper/20"
                    >
                      <Avatar name={p.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-semibold text-paper">
                          {p.name}
                          {p.relationship && (
                            <span className="ml-1.5 text-[13px] font-medium text-paper/55">
                              · {p.relationship}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[12px] text-paper/55">
                          마지막 기록 {daysAgo(p.last_updated_at)}일 전
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
    </main>
  );
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function DateBadge({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000)
    .toISOString()
    .slice(0, 10);

  let top: string;
  let bottom: string;

  if (date === today) {
    top = "오늘";
    bottom = "";
  } else if (date === tomorrow) {
    top = "내일";
    bottom = "";
  } else {
    top = String(d.getMonth() + 1);
    bottom = String(d.getDate()).padStart(2, "0");
  }

  return (
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-gold/10">
      {bottom ? (
        <>
          <span className="text-[10px] font-semibold leading-none text-gold/70">
            {top}월
          </span>
          <span className="mt-0.5 text-[15px] font-bold leading-none tabular-nums text-gold">
            {bottom}
          </span>
        </>
      ) : (
        <span className="text-[12.5px] font-bold text-gold">{top}</span>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  subtitle,
  children,
}: {
  title: string;
  count: number;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-2">
      <div className="mb-2.5 flex items-baseline gap-1.5">
        <h2 className="text-[15px] font-bold text-paper">{title}</h2>
        <span className="text-[13px] font-medium tabular-nums text-paper/50">
          {count}
        </span>
        {subtitle && (
          <span className="text-[12px] text-paper/45">· {subtitle}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-paper/4 px-4 py-5 text-center text-[13px] text-paper/50">
      {children}
    </div>
  );
}
