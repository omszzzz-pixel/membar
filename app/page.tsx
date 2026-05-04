"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PersonCard from "@/components/PersonCard";
import InputModal from "@/components/InputModal";
import PersonDetail from "@/components/PersonDetail";
import SearchBar from "@/components/SearchBar";
import SignInSheet from "@/components/SignInSheet";
import TimelineSheet from "@/components/TimelineSheet";
import DisambigSheet, { type Candidate } from "@/components/DisambigSheet";
import PaywallSheet from "@/components/PaywallSheet";
import SaveToast from "@/components/SaveToast";
import InstallBanner from "@/components/InstallBanner";
import VisitTracker from "@/components/VisitTracker";
import { useUsage } from "@/lib/useUsage";
import { apiFetch } from "@/lib/apiFetch";
import {
  GUEST_HARD_LIMIT,
  GUEST_MEDIUM_NUDGE,
  GUEST_SOFT_NUDGE,
  MEMO_WARN_AT,
  MONTHLY_MEMO_LIMIT,
  type Person,
  type SortKey,
} from "@/lib/types";
import { useUser } from "@/lib/userContext";
import {
  CREATE_EXAMPLES,
  EDIT_EXAMPLES,
  SAMPLE_PERSONS,
  isSample,
} from "@/lib/sampleData";

type Mode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; person: Person }
  | { kind: "detail"; person: Person };

export default function Home() {
  const { userId, authed, loading: userLoading } = useUser();
  const [persons, setPersons] = useState<Person[] | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [signInOpen, setSignInOpen] = useState(false);
  const [paywall, setPaywall] = useState<"persons" | "memos" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [disambig, setDisambig] = useState<{
    input: string;
    parsedName: string;
    candidates: Candidate[];
  } | null>(null);
  const [saveToast, setSaveToast] = useState<{
    name: string;
    kind: "new" | "updated";
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { usage, refresh: refreshUsage } = useUsage(userId);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const res = await apiFetch(
      `/api/persons?userId=${encodeURIComponent(userId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return;
    const data = (await res.json()) as { persons: Person[] };
    setPersons(data.persons);
  }, [userId]);

  // 캐시된 persons 즉시 표시 (깜빡임 제거)
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`membar_persons_cache_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          persons: Person[];
          ts: number;
        };
        if (
          parsed.persons &&
          Date.now() - parsed.ts < 7 * 24 * 60 * 60 * 1000
        ) {
          setPersons(parsed.persons);
        }
      }
    } catch {
      // ignore
    }
  }, [userId]);

  // persons가 바뀔 때마다 캐시 자동 갱신 (refresh, optimistic update 모두 커버)
  useEffect(() => {
    if (!userId || !persons) return;
    try {
      localStorage.setItem(
        `membar_persons_cache_${userId}`,
        JSON.stringify({ persons, ts: Date.now() })
      );
    } catch {
      // ignore
    }
  }, [userId, persons]);

  useEffect(() => {
    if (userId) void refresh();
  }, [userId, refresh]);

  // (자동 모달 오픈 제거 — 광고 유입 유저가 컨텍스트 없이 입력창 보고 바로
  //  이탈하는 문제로 EmptyHint(샘플+CTA) 우선 노출 방식으로 전환)

  const filteredSorted = useMemo(() => {
    if (!persons) return [];
    const q = query.trim().toLowerCase();
    const list = q
      ? persons.filter((p) => {
          const hay = [
            p.name,
            p.title ?? "",
            p.company ?? "",
            p.location ?? "",
            p.education ?? "",
            p.relationship ?? "",
            p.notes ?? "",
            ...(p.tags ?? []),
            ...(p.interests ?? []),
            ...(p.business ?? []),
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      : [...persons];

    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else if (sort === "favorite") {
      list.sort((a, b) => {
        if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
        return (
          new Date(b.last_updated_at).getTime() -
          new Date(a.last_updated_at).getTime()
        );
      });
    } else {
      list.sort(
        (a, b) =>
          new Date(b.last_updated_at).getTime() -
          new Date(a.last_updated_at).getTime()
      );
    }
    return list;
  }, [persons, query, sort]);

  const count = persons?.length ?? 0;
  const memosUsed = usage.memos;
  const isPro = usage.pro;
  // Pro 유저는 모든 한도/넛지를 우회
  const softNudge =
    !isPro && count >= GUEST_SOFT_NUDGE && count < GUEST_MEDIUM_NUDGE;
  const mediumNudge =
    !isPro && count >= GUEST_MEDIUM_NUDGE && count < GUEST_HARD_LIMIT;
  const memoNudge =
    !isPro && memosUsed >= MEMO_WARN_AT && memosUsed < MONTHLY_MEMO_LIMIT;
  const atPersonLimit = !isPro && count >= GUEST_HARD_LIMIT;
  const atMemoLimit = !isPro && memosUsed >= MONTHLY_MEMO_LIMIT;

  const handleOpenCreate = () => {
    if (atMemoLimit) {
      setPaywall("memos");
      return;
    }
    if (atPersonLimit) {
      setPaywall("persons");
      return;
    }
    setMode({ kind: "create" });
  };

  const handleSubmit = async (
    input: string,
    editingId?: string,
    forceCreate?: boolean
  ) => {
    if (!userId) return;
    setSubmitting(true);
    setSubmitError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await apiFetch("/api/persons", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, input, id: editingId, forceCreate }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let body: Record<string, unknown> = {};
      try {
        body = await res.json();
      } catch {
        // non-JSON response (e.g., gateway timeout HTML)
      }

      if ((body as { needsDisambiguation?: boolean })?.needsDisambiguation) {
        setDisambig({
          input,
          parsedName: (body as { parsedName: string }).parsedName,
          candidates: (body as { candidates: Candidate[] }).candidates,
        });
        setMode({ kind: "closed" });
        return;
      }

      if (!res.ok) {
        const err = (body as { error?: string })?.error;
        if (err === "limit") {
          setPaywall("persons");
          setMode({ kind: "closed" });
          return;
        }
        if (err === "memo_limit") {
          setPaywall("memos");
          setMode({ kind: "closed" });
          return;
        }
        if (err === "rate_limit" || res.status === 429) {
          setSubmitError(
            "AI 서버가 바빠요. 10초 뒤 다시 시도해주세요."
          );
          return;
        }
        if (err === "no_name") {
          setSubmitError(
            (body as { message?: string })?.message ??
              "누구에 대한 메모인지 알 수 없었어요. 이름이나 호칭(장인어른·엄마 등)을 함께 써주세요."
          );
          return;
        }
        if (res.status >= 500) {
          setSubmitError("서버 오류. 잠시 후 다시 시도해주세요.");
          return;
        }
        setSubmitError(err ?? "저장 실패. 다시 시도해주세요.");
        return;
      }
      const saved = (body as { person?: Person })?.person;
      if (saved) {
        const wasExisting =
          persons?.some((p) => p.id === saved.id) ?? false;
        setPersons((prev) => {
          if (!prev) return [saved];
          const idx = prev.findIndex((p) => p.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });

        setSaveToast({
          name: saved.name,
          kind: wasExisting ? "updated" : "new",
        });
      }
      setMode({ kind: "closed" });
      void refreshUsage();
    } catch (e) {
      clearTimeout(timeoutId);
      if ((e as Error)?.name === "AbortError") {
        setSubmitError(
          "응답이 너무 늦어요. 네트워크 확인 후 다시 시도해주세요."
        );
      } else {
        setSubmitError("연결 오류. 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePerson = async (updated: Person) => {
    setPersons((prev) =>
      prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev
    );
    if (mode.kind === "detail" && mode.person.id === updated.id) {
      setMode({ kind: "detail", person: updated });
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (isSample(id)) {
      setMode({ kind: "closed" });
      return;
    }
    if (!confirm("이 사람을 삭제할까요?")) return;
    setPersons((prev) => prev?.filter((p) => p.id !== id) ?? prev);
    setMode({ kind: "closed" });
    void apiFetch(
      `/api/persons?userId=${encodeURIComponent(userId)}&id=${id}`,
      { method: "DELETE" }
    );
  };

  const empty = persons !== null && persons.length === 0;

  return (
    <main className="relative min-h-dvh">
      <VisitTracker />
      <InstallBanner />
      <header className="sticky top-0 z-10 border-b border-paper/8 bg-ink px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[20px] font-bold text-paper">membar</h1>
            <span className="text-[13px] font-medium tabular-nums text-paper/50">
              {count}명
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setTimelineOpen(true)}
              aria-label="타임라인"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-paper/65 transition hover:bg-paper/6 hover:text-paper"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16M4 12h16M4 18h10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              onClick={handleOpenCreate}
              className="ml-1 rounded-lg bg-gold px-3.5 py-2 text-[13.5px] font-semibold text-white transition hover:bg-gold-soft"
            >
              + 메모
            </button>
          </div>
        </div>

        {persons && persons.length > 0 && (
          <div className="mt-3 space-y-2">
            <SearchBar value={query} onChange={setQuery} />
            <div className="flex gap-1">
              {(
                [
                  ["recent", "최근순"],
                  ["name", "이름순"],
                  ["favorite", "즐겨찾기"],
                ] as [SortKey, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                    sort === k
                      ? "bg-gold/12 text-gold"
                      : "text-paper/60 hover:bg-paper/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {softNudge && !userLoading && (
        <div className="mx-4 mt-3 flex items-start gap-3 rounded-lg border border-paper/10 bg-paper/4 px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-paper">
              기록이 {count}명 쌓였어요
            </div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-paper/65">
              {authed
                ? `${GUEST_HARD_LIMIT}명까지 무료예요. Pro는 무제한.`
                : "앱 삭제하면 사라질 수 있어요. 로그인하면 안전하게 보관돼요."}
            </div>
          </div>
          <button
            onClick={() =>
              authed ? setPaywall("persons") : setSignInOpen(true)
            }
            className="shrink-0 rounded-md bg-paper/10 px-3 py-1.5 text-[12.5px] font-semibold text-paper hover:bg-paper/18"
          >
            {authed ? "Pro" : "안전하게"}
          </button>
        </div>
      )}

      {mediumNudge && !userLoading && (
        <div className="mx-4 mt-3 flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/10 px-3.5 py-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="mt-[2px] shrink-0 text-gold"
          >
            <path
              d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.8 7.1 17.2l.9-5.5-4-3.9 5.5-.8L12 2z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-paper">
              {GUEST_HARD_LIMIT}명까지 {GUEST_HARD_LIMIT - count}자리 남았어요
            </div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-paper/70">
              {authed
                ? "Pro로 업그레이드하면 무제한 사용 가능해요."
                : "계정 만들면 Pro로 무제한 사용 가능해요. 1분 만에 가입."}
            </div>
          </div>
          <button
            onClick={() =>
              authed ? setPaywall("persons") : setSignInOpen(true)
            }
            className="shrink-0 rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-gold-soft"
          >
            {authed ? "업그레이드" : "가입"}
          </button>
        </div>
      )}

      {memoNudge && !userLoading && (
        <div className="mx-4 mt-3 flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/10 px-3.5 py-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="mt-[2px] shrink-0 text-gold"
          >
            <path
              d="M4 4h16v16H4z M4 9h16 M9 4v16"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-paper">
              이번 달 메모 {MONTHLY_MEMO_LIMIT - memosUsed}개 남았어요
            </div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-paper/70">
              {authed
                ? "Pro로 업그레이드하면 메모 무제한이에요."
                : "계정 만들고 Pro 업그레이드하면 무제한 메모."}
            </div>
          </div>
          <button
            onClick={() =>
              authed ? setPaywall("memos") : setSignInOpen(true)
            }
            className="shrink-0 rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-gold-soft"
          >
            {authed ? "업그레이드" : "가입"}
          </button>
        </div>
      )}

      <section className="px-4 pb-28 pt-4">
        {persons === null ? (
          <div className="pt-20 text-center text-[14px] text-paper/45">
            불러오는 중
          </div>
        ) : empty ? (
          <EmptyHint
            onOpen={() => setMode({ kind: "create" })}
            onSampleClick={(p) => setMode({ kind: "detail", person: p })}
          />
        ) : filteredSorted.length === 0 ? (
          <div className="pt-16 text-center text-[14px] text-paper/45">
            일치하는 사람 없음
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filteredSorted.map((p, i) => (
              <li
                key={p.id}
                className="anim-fade-up"
                style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
              >
                <PersonCard
                  person={p}
                  onClick={() => setMode({ kind: "detail", person: p })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {mode.kind === "create" && (
        <InputModal
          title="이름이랑 떠오르는 걸 그냥 쓰세요"
          placeholder="누구 이름이랑 떠오르는 거 막 쳐요"
          examples={CREATE_EXAMPLES}
          memosUsed={memosUsed}
          memoLimit={isPro ? undefined : MONTHLY_MEMO_LIMIT}
          memoWarnAt={isPro ? undefined : MEMO_WARN_AT}
          error={submitError}
          onClose={() => {
            setSubmitError(null);
            setMode({ kind: "closed" });
          }}
          onSubmit={(text) => handleSubmit(text)}
          submitting={submitting}
          onUpgrade={() => {
            setSubmitError(null);
            setMode({ kind: "closed" });
            setPaywall("memos");
          }}
        />
      )}

      {mode.kind === "edit" && (
        <InputModal
          title={`${mode.person.name} 수정`}
          placeholder="바뀐 거 있으면 그냥 치세요"
          examples={EDIT_EXAMPLES}
          memosUsed={memosUsed}
          memoLimit={isPro ? undefined : MONTHLY_MEMO_LIMIT}
          memoWarnAt={isPro ? undefined : MEMO_WARN_AT}
          error={submitError}
          onClose={() => {
            setSubmitError(null);
            setMode({ kind: "detail", person: mode.person });
          }}
          onSubmit={(text) => handleSubmit(text, mode.person.id)}
          submitting={submitting}
          onUpgrade={() => {
            setSubmitError(null);
            setMode({ kind: "detail", person: mode.person });
            setPaywall("memos");
          }}
        />
      )}

      {mode.kind === "detail" && (
        <PersonDetail
          person={mode.person}
          userId={userId}
          onClose={() => setMode({ kind: "closed" })}
          onEdit={() => setMode({ kind: "edit", person: mode.person })}
          onDelete={() => handleDelete(mode.person.id)}
          onUpdate={handleUpdatePerson}
          onCreateMemo={() => setMode({ kind: "create" })}
        />
      )}

      {disambig && (
        <DisambigSheet
          parsedName={disambig.parsedName}
          input={disambig.input}
          candidates={disambig.candidates}
          onPick={(id) => {
            const input = disambig.input;
            setDisambig(null);
            void handleSubmit(input, id);
          }}
          onCreateNew={() => {
            const input = disambig.input;
            setDisambig(null);
            void handleSubmit(input, undefined, true);
          }}
          onClose={() => setDisambig(null)}
        />
      )}

      {signInOpen && (
        <SignInSheet
          title="로그인"
          message="데이터를 안전하게 보관하고 여러 기기에서 이어 쓰려면 로그인하세요."
          onClose={() => setSignInOpen(false)}
        />
      )}

      {paywall && (
        <PaywallSheet reason={paywall} onClose={() => setPaywall(null)} />
      )}

      {saveToast && (
        <SaveToast
          name={saveToast.name}
          kind={saveToast.kind}
          onClose={() => setSaveToast(null)}
        />
      )}

      {timelineOpen && (
        <TimelineSheet
          userId={userId}
          onClose={() => setTimelineOpen(false)}
          onPersonClick={(personId) => {
            const p =
              persons?.find((x) => x.id === personId) ??
              SAMPLE_PERSONS.find((x) => x.id === personId);
            if (p) {
              setTimelineOpen(false);
              setMode({ kind: "detail", person: p });
            }
          }}
        />
      )}

      {/* 항상 떠있는 메모 등록 FAB (하단바 위).
          아직 인맥이 0명일 땐 EmptyHint의 '첫 메모 등록하기'와 중복되므로 숨김. */}
      {mode.kind === "closed" &&
        !timelineOpen &&
        !paywall &&
        !signInOpen &&
        persons &&
        persons.length > 0 && (
        <div
          className="pointer-events-none fixed inset-x-0 z-20 mx-auto flex max-w-[430px] justify-center px-4"
          style={{
            bottom: "calc(72px + env(safe-area-inset-bottom))",
          }}
        >
          <button
            onClick={() => setMode({ kind: "create" })}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-[14.5px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(255,111,15,0.6)] transition hover:bg-gold-soft active:scale-[0.97]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
            메모 등록
          </button>
        </div>
      )}
    </main>
  );
}

function EmptyHint({
  onOpen,
  onSampleClick,
}: {
  onOpen: () => void;
  onSampleClick: (p: Person) => void;
}) {
  return (
    <div className="anim-fade-up">
      {/* 히어로 — 가치 프롭 명확히 */}
      <div className="pt-3">
        <div className="text-[24px] font-black leading-tight text-paper">
          AI가 정리해주는<br />
          <span className="text-gold">인맥 관리</span>
        </div>
        <div className="mt-2.5 text-[14px] leading-relaxed text-paper/65">
          누구랑 무슨 얘기 했는지 막 적어두세요.<br />
          AI가 사람·관심사·해야 할 일까지 자동 정리해줘요.
        </div>
      </div>

      {/* 핵심 기능 3개 (시각적 신뢰) */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <FeaturePill icon="✏️" text="막 입력" />
        <FeaturePill icon="🪄" text="AI 정리" />
        <FeaturePill icon="📋" text="만남 전 브리핑" />
      </div>

      {/* 샘플 — 광고에서 본 그 화면을 즉시 체험 */}
      <div className="mt-6 rounded-xl border border-gold/30 bg-gold/8 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[13.5px] font-bold text-gold">
              👇 예시 인물 탭해보기
            </div>
            <div className="mt-0.5 text-[12px] text-paper/60">
              실제 입력 → AI 정리 결과를 미리 볼 수 있어요
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {SAMPLE_PERSONS.map((p) => (
          <li key={p.id}>
            <PersonCard person={p} onClick={() => onSampleClick(p)} />
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <button
          onClick={onOpen}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-[14.5px] font-semibold text-white transition hover:bg-gold-soft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          내 인맥 등록 시작
        </button>
      </div>
    </div>
  );
}

function FeaturePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-paper/10 bg-surface px-2 py-3">
      <div className="text-[20px]">{icon}</div>
      <div className="text-center text-[11.5px] font-semibold text-paper/75 leading-tight">
        {text}
      </div>
    </div>
  );
}

