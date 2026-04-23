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
import InstallBanner from "@/components/InstallBanner";
import InstallToast from "@/components/InstallToast";
import SaveToast from "@/components/SaveToast";
import { useUsage } from "@/lib/useUsage";
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
  const [installToastOpen, setInstallToastOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<{
    name: string;
    kind: "new" | "updated";
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { usage, refresh: refreshUsage } = useUsage(userId);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(
      `/api/persons?userId=${encodeURIComponent(userId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return;
    const data = (await res.json()) as { persons: Person[] };
    setPersons(data.persons);
  }, [userId]);

  useEffect(() => {
    if (userId) void refresh();
  }, [userId, refresh]);

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
  const softNudge =
    !authed && count >= GUEST_SOFT_NUDGE && count < GUEST_MEDIUM_NUDGE;
  const mediumNudge =
    !authed && count >= GUEST_MEDIUM_NUDGE && count < GUEST_HARD_LIMIT;
  const atPersonLimit = count >= GUEST_HARD_LIMIT;
  const atMemoLimit = memosUsed >= MONTHLY_MEMO_LIMIT;

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
      const res = await fetch("/api/persons", {
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

        // First-memo install nudge (once per browser). Otherwise show save toast.
        let shouldShowInstall = false;
        try {
          if (!localStorage.getItem("membar_install_toast_shown")) {
            localStorage.setItem("membar_install_toast_shown", "1");
            shouldShowInstall = true;
          }
        } catch {
          // ignore
        }

        if (shouldShowInstall) {
          setInstallToastOpen(true);
        } else {
          setSaveToast({
            name: saved.name,
            kind: wasExisting ? "updated" : "new",
          });
        }
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
    void fetch(
      `/api/persons?userId=${encodeURIComponent(userId)}&id=${id}`,
      { method: "DELETE" }
    );
  };

  const empty = persons !== null && persons.length === 0;

  return (
    <main className="relative min-h-dvh">
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
              기록이 {count}개 쌓였어요
            </div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-paper/65">
              앱 삭제하면 사라질 수 있어요. 로그인하면 안전하게 보관돼요.
            </div>
          </div>
          <button
            onClick={() => setSignInOpen(true)}
            className="shrink-0 rounded-md bg-paper/10 px-3 py-1.5 text-[12.5px] font-semibold text-paper hover:bg-paper/18"
          >
            안전하게
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
              계정 만들면 Pro로 무제한 사용 가능해요. 1분 만에 가입.
            </div>
          </div>
          <button
            onClick={() => setSignInOpen(true)}
            className="shrink-0 rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-gold-soft"
          >
            가입
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
          title="메모 등록"
          placeholder="누구 이름이랑 떠오르는 거 막 쳐요"
          examples={CREATE_EXAMPLES}
          memosUsed={memosUsed}
          memoLimit={MONTHLY_MEMO_LIMIT}
          memoWarnAt={MEMO_WARN_AT}
          error={submitError}
          onClose={() => {
            setSubmitError(null);
            setMode({ kind: "closed" });
          }}
          onSubmit={(text) => handleSubmit(text)}
          submitting={submitting}
        />
      )}

      {mode.kind === "edit" && (
        <InputModal
          title={`${mode.person.name} 수정`}
          placeholder="바뀐 거 있으면 그냥 치세요"
          examples={EDIT_EXAMPLES}
          memosUsed={memosUsed}
          memoLimit={MONTHLY_MEMO_LIMIT}
          memoWarnAt={MEMO_WARN_AT}
          error={submitError}
          onClose={() => {
            setSubmitError(null);
            setMode({ kind: "detail", person: mode.person });
          }}
          onSubmit={(text) => handleSubmit(text, mode.person.id)}
          submitting={submitting}
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

      {installToastOpen && (
        <InstallToast onClose={() => setInstallToastOpen(false)} />
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
            const p = persons?.find((x) => x.id === personId);
            if (p) {
              setTimelineOpen(false);
              setMode({ kind: "detail", person: p });
            }
          }}
        />
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
      <div className="pt-4">
        <div className="text-[18px] font-bold text-paper">
          이름이랑 떠오르는 걸 그냥 쓰세요
        </div>
        <div className="mt-1 text-[14px] text-paper/60">
          AI가 알아서 분류·정리해 드려요.
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-paper/60">
            예시
          </span>
          <span className="text-[12.5px] text-paper/45">
            탭해서 둘러보기
          </span>
        </div>
        <ul className="space-y-2">
          {SAMPLE_PERSONS.map((p) => (
            <li key={p.id}>
              <PersonCard person={p} onClick={() => onSampleClick(p)} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <button
          onClick={onOpen}
          className="w-full rounded-lg bg-gold py-3.5 text-[14.5px] font-semibold text-white transition hover:bg-gold-soft"
        >
          + 첫 메모 등록하기
        </button>
      </div>
    </div>
  );
}

