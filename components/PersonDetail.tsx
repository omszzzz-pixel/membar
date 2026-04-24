"use client";

import { useCallback, useEffect, useState } from "react";
import Avatar from "./Avatar";
import BriefingSheet from "./BriefingSheet";
import MeetingCalendar from "./MeetingCalendar";
import ShareSheet from "./ShareSheet";
import type { HistoryEntry, Meeting, Person, Todo } from "@/lib/types";
import { SAMPLE_HISTORY, isSample } from "@/lib/sampleData";
import { formatShareText } from "@/lib/shareText";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

type Props = {
  person: Person;
  userId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updated: Person) => void;
};

export default function PersonDetail({
  person,
  userId,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
}: Props) {
  useLockBodyScroll();
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const sample = isSample(person.id);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/persons/history?personId=${person.id}&userId=${encodeURIComponent(
          userId
        )}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as { history: HistoryEntry[] };
        setHistory(data.history);
      }
    } catch {
      // ignore
    }
  }, [person.id, userId]);

  useEffect(() => {
    if (sample) {
      setHistory(SAMPLE_HISTORY[person.id] ?? []);
      return;
    }
    void loadHistory();
  }, [sample, person.id, loadHistory]);

  const patch = async (body: Record<string, unknown>) => {
    if (sample) {
      onUpdate({ ...person, ...(body as Partial<Person>) });
      return;
    }
    const res = await fetch("/api/persons", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, id: person.id, patch: body }),
    });
    if (res.ok) {
      const data = (await res.json()) as { person: Person };
      onUpdate(data.person);
    }
  };

  const toggleFavorite = () => patch({ is_favorite: !person.is_favorite });

  const toggleTodo = (idx: number) => {
    const next: Todo[] = (person.todos ?? []).map((t, i) =>
      i === idx ? { ...t, done: !t.done } : t
    );
    void patch({ todos: next });
  };

  const addTodayMeeting = () => {
    const today = new Date().toISOString().slice(0, 10);
    const current: Meeting[] = person.meetings ?? [];
    if (current.some((m) => m.date === today)) return;
    const next: Meeting[] = [{ date: today }, ...current].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    void patch({ meetings: next });
  };

  const removeMeeting = (date: string) => {
    const next = (person.meetings ?? []).filter((m) => m.date !== date);
    void patch({ meetings: next });
  };

  const removeMemo = async (memoId: string) => {
    if (sample) {
      setHistory((prev) => (prev ?? []).filter((h) => h.id !== memoId));
      return;
    }
    // Optimistic remove
    setHistory((prev) => (prev ?? []).filter((h) => h.id !== memoId));
    try {
      await fetch(
        `/api/persons/history?id=${memoId}&userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
    } catch {
      // If network fails, reload history to stay consistent
      void loadHistory();
    }
  };

  const subtitle = [person.title, person.company].filter(Boolean).join(" · ");

  return (
    <div className="anim-fade-in fixed inset-0 z-40 bg-ink">
      <div className="anim-sheet-up mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-surface">
        <div className="flex items-start gap-3 px-5 pb-4 pt-5">
          <Avatar name={person.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <div className="truncate text-[20px] font-bold text-paper">
                {person.name}
              </div>
              <button
                onClick={toggleFavorite}
                className={`shrink-0 text-[16px] transition ${
                  person.is_favorite
                    ? "text-gold"
                    : "text-paper/25 hover:text-paper/55"
                }`}
                aria-label="즐겨찾기"
              >
                ★
              </button>
            </div>
            {person.relationship && (
              <div className="mt-0.5 text-[13px] font-medium text-paper/55">
                {person.relationship}
              </div>
            )}
            {subtitle && (
              <div className="mt-0.5 truncate text-[13.5px] text-paper/70">
                {subtitle}
              </div>
            )}
          </div>
          <div className="-mt-1 flex items-start gap-0.5">
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-lg p-2 text-paper/60 transition hover:bg-paper/8 hover:text-paper"
              aria-label="공유"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v13M8 7l4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {!sample && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `${person.name}님을 삭제할까요? 기록도 함께 지워져요.`
                    )
                  ) {
                    onDelete();
                  }
                }}
                className="rounded-lg p-2 text-paper/55 transition hover:bg-terra/10 hover:text-terra"
                aria-label="삭제"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-paper/60 transition hover:bg-paper/8 hover:text-paper"
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
        </div>

        <div className="h-px bg-paper/8" />

        <div className="px-5 pt-3">
          <button
            onClick={() => setBriefingOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-gold/35 bg-gold/10 px-4 py-3 transition hover:bg-gold/14"
          >
            <div className="flex items-center gap-2.5">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gold"
              >
                <path
                  d="M7 3h10l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 13h6M9 17h4M9 9h3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-left">
                <div className="text-[14px] font-semibold text-gold">
                  만남 전 브리핑
                </div>
                <div className="text-[12px] text-paper/55">
                  AI가 히스토리 읽고 한 페이지로
                </div>
              </div>
            </div>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className="text-gold/70"
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
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-1 scrollbar-none">
          {sample && (
            <div className="mt-3 rounded-lg border border-gold/25 bg-gold/8 px-3.5 py-2.5 text-[13px] leading-relaxed text-paper/80">
              <span className="font-semibold text-gold">예시</span> — 실제
              데이터가 아닙니다. 이런 식으로 정리된다는 샘플이에요.
            </div>
          )}

          <Section title="프로필">
            <KV label="직함" value={person.title} />
            <KV label="회사" value={person.company} />
            <KV label="지역" value={person.location} />
            <KV label="학력" value={person.education} />
            <KV label="관계" value={person.relationship} />
            <KV
              label="출생"
              value={person.birth_year ? `${person.birth_year}년생` : null}
            />
          </Section>

          {(person.family?.spouse ||
            person.family?.children ||
            person.family?.father ||
            person.family?.mother ||
            person.family?.siblings ||
            person.family?.notes) && (
            <Section title="가족">
              {person.family?.spouse && <KV label="배우자" value="있음" />}
              {person.family?.children ? (
                <KV label="자녀" value={`${person.family.children}명`} />
              ) : null}
              <KV label="아버지" value={person.family?.father ?? null} />
              <KV label="어머니" value={person.family?.mother ?? null} />
              <KV label="형제자매" value={person.family?.siblings ?? null} />
              <KV label="기타" value={person.family?.notes ?? null} />
            </Section>
          )}

          {person.interests?.length > 0 && (
            <Section title="관심사">
              <Chips items={person.interests} />
            </Section>
          )}

          {person.business?.length > 0 && (
            <Section title="비즈니스">
              <Chips items={person.business} />
            </Section>
          )}

          {person.tags?.length > 0 && (
            <Section title="태그">
              <Chips items={person.tags} />
            </Section>
          )}

          <Section title={`챙길 것 · ${person.todos?.length ?? 0}`}>
            {person.todos && person.todos.length > 0 ? (
              <ul className="space-y-2.5">
                {person.todos.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTodo(i)}
                      className={`mt-[2px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-md border transition ${
                        t.done
                          ? "border-gold bg-gold"
                          : "border-paper/30 hover:border-paper/50"
                      }`}
                      aria-label="완료 토글"
                    >
                      {t.done && (
                        <svg viewBox="0 0 16 16" width="13" height="13" className="text-white">
                          <path
                            d="M3.5 8.5l3 3 6-6.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                    <div
                      className={`text-[14.5px] leading-relaxed ${
                        t.done
                          ? "text-paper/40 line-through"
                          : "text-paper/90"
                      }`}
                    >
                      {t.text}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>없음</Empty>
            )}
          </Section>

          {person.i_said?.length > 0 && (
            <Section title="내가 한 말">
              <ul className="space-y-1.5">
                {person.i_said.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-paper/4 px-3 py-2 text-[14px] leading-relaxed text-paper/85"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {person.notes && (
            <Section title="메모">
              <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-paper/85">
                {person.notes}
              </div>
            </Section>
          )}

          <Section title="기록">
            <MeetingCalendar
              meetings={person.meetings ?? []}
              history={history ?? []}
              onAddToday={addTodayMeeting}
              onRemoveMeeting={removeMeeting}
              onRemoveMemo={removeMemo}
            />
          </Section>
        </div>

        <div className="flex gap-2 border-t border-paper/8 bg-surface px-5 py-3">
          <button
            onClick={sample ? onClose : onEdit}
            className="flex-1 rounded-lg bg-gold py-3 text-[14.5px] font-semibold text-white transition hover:bg-gold-soft"
          >
            {sample ? "닫고 직접 추가하기" : "막 치면 AI가 반영"}
          </button>
        </div>
      </div>

      {briefingOpen && (
        <BriefingSheet
          person={person}
          history={history ?? []}
          onClose={() => setBriefingOpen(false)}
        />
      )}

      {shareOpen && (
        <ShareSheet
          title={`${person.name} 공유`}
          text={formatShareText(person)}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-3">
      <div className="mb-2 text-[14px] font-bold text-paper">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between py-2">
      <span className="text-[13.5px] text-paper/55">{label}</span>
      <span className="text-right text-[14px] font-medium text-paper">
        {value}
      </span>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i}
          className="rounded-md bg-paper/6 px-2.5 py-1 text-[13px] font-medium text-paper/80"
        >
          {i}
        </span>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[13.5px] text-paper/50">{children}</div>;
}
