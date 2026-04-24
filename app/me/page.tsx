"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";
import SignInSheet from "@/components/SignInSheet";
import PaywallSheet from "@/components/PaywallSheet";
import FeedbackBox from "@/components/FeedbackBox";
import { apiFetch } from "@/lib/apiFetch";
import { useUser } from "@/lib/userContext";
import { useUsage } from "@/lib/useUsage";
import {
  GUEST_HARD_LIMIT,
  MEMO_WARN_AT,
  MONTHLY_MEMO_LIMIT,
  type Person,
} from "@/lib/types";

export default function MePage() {
  const { userId, authed, email, name, loading: userLoading, signOut } = useUser();
  const { usage } = useUsage(userId);
  const [persons, setPersons] = useState<Person[] | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const res = await apiFetch(
        `/api/persons?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { persons: Person[] };
      setPersons(data.persons);
    })();
  }, [userId]);

  const stats = useMemo(() => {
    if (!persons) return { total: 0, addedThisMonth: 0, favorite: 0 };
    const monthPrefix = new Date().toISOString().slice(0, 7);
    let addedThisMonth = 0;
    let favorite = 0;
    for (const p of persons) {
      if (p.is_favorite) favorite++;
      if (p.created_at?.startsWith(monthPrefix)) addedThisMonth++;
    }
    return {
      total: persons.length,
      addedThisMonth,
      favorite,
    };
  }, [persons]);

  const memoPct = Math.min(
    100,
    Math.round((usage.memos / MONTHLY_MEMO_LIMIT) * 100)
  );
  const memoBarColor =
    usage.memos >= MONTHLY_MEMO_LIMIT
      ? "bg-terra"
      : usage.memos >= MEMO_WARN_AT
      ? "bg-gold"
      : "bg-gold/70";

  const displayName = authed ? name ?? "사용자" : "게스트";
  const subText = authed
    ? email ?? "로그인됨"
    : `로컬에 저장 중 · ${stats.total}/${GUEST_HARD_LIMIT}명`;

  return (
    <main className="relative min-h-dvh pb-24">
      <header className="sticky top-0 z-10 border-b border-paper/8 bg-ink px-4 pb-3 pt-4">
        <h1 className="text-[20px] font-bold text-paper">나</h1>
      </header>

      <div className="px-4 pt-4">
        {/* Profile */}
        <div className="rounded-xl border border-paper/10 bg-surface px-4 py-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] font-bold text-paper">
                {displayName}
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-paper/60">
                {subText}
              </div>
            </div>
            {!authed && (
              <button
                onClick={() => setSignInOpen(true)}
                disabled={userLoading}
                className="shrink-0 rounded-lg bg-gold px-3 py-2 text-[13px] font-semibold text-white hover:bg-gold-soft"
              >
                로그인
              </button>
            )}
          </div>
        </div>

        {/* Feedback — 최상단 노출 */}
        <Section title="개발자에게 바란다">
          <FeedbackBox />
        </Section>

        {/* Stats */}
        <Section title="내 인맥 현황">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="총 인맥" value={stats.total} />
            <Stat label="이번달 추가" value={stats.addedThisMonth} />
            <Stat label="메모" value={usage.memos} />
          </div>
        </Section>

        {/* Memo usage bar */}
        <Section title="이번 달 메모">
          <div className="rounded-xl border border-paper/10 bg-surface px-4 py-3.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-medium text-paper/65">
                {usage.memos} / {MONTHLY_MEMO_LIMIT}개 사용
              </span>
              <span className="text-[12.5px] font-semibold tabular-nums text-paper/50">
                {memoPct}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-paper/8">
              <div
                className={`h-full rounded-full transition-all ${memoBarColor}`}
                style={{ width: `${memoPct}%` }}
              />
            </div>
            {usage.memos >= MONTHLY_MEMO_LIMIT ? (
              <div className="mt-2 text-[12px] font-medium text-terra">
                이번 달 메모 한도 도달. 다음 달 1일에 초기화돼요.
              </div>
            ) : usage.memos >= MEMO_WARN_AT ? (
              <div className="mt-2 text-[12px] font-medium text-paper/60">
                이번 달 {MONTHLY_MEMO_LIMIT - usage.memos}개 남았어요
              </div>
            ) : null}
          </div>
        </Section>

        {/* Upgrade */}
        <Section title="Pro 업그레이드">
          <button
            onClick={() => setPaywallOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-gold/30 bg-gold/8 px-4 py-3.5 text-left transition hover:bg-gold/14"
          >
            <div>
              <div className="text-[14.5px] font-bold text-gold">
                무제한 인맥 · 메모 · 브리핑
              </div>
              <div className="mt-0.5 text-[12.5px] text-paper/70">
                월 4,990원부터
              </div>
            </div>
            <svg
              width="16"
              height="16"
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
        </Section>

        {/* Settings */}
        <Section title="설정">
          <div className="overflow-hidden rounded-xl border border-paper/10 bg-surface">
            <Row label="다크모드">
              <ThemeToggle />
            </Row>
            <Divider />
            {authed ? (
              <Row label="데이터 백업">
                <span className="text-[12.5px] text-paper/60">
                  Supabase 자동 백업 중
                </span>
              </Row>
            ) : (
              <button
                onClick={() => setSignInOpen(true)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-paper/4"
              >
                <span className="text-[14px] font-medium text-paper">
                  데이터 백업
                </span>
                <span className="text-[12.5px] font-semibold text-gold">
                  로그인하기
                </span>
              </button>
            )}
            {authed && (
              <>
                <Divider />
                <button
                  onClick={async () => {
                    await signOut();
                    window.location.reload();
                  }}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-paper/4"
                >
                  <span className="text-[14px] font-medium text-terra">
                    로그아웃
                  </span>
                </button>
              </>
            )}
          </div>
        </Section>

        {/* 약관 · 정책 링크 */}
        <Section title="약관 · 정책">
          <div className="overflow-hidden rounded-xl border border-paper/10 bg-surface">
            <LegalLink href="/terms">이용약관</LegalLink>
            <Divider />
            <LegalLink href="/privacy">개인정보 처리방침</LegalLink>
            <Divider />
            <LegalLink href="/refund">환불 정책</LegalLink>
            <Divider />
            <LegalLink href="/business">사업자 정보</LegalLink>
          </div>
        </Section>

        <div className="mt-8 text-center text-[11.5px] text-paper/35">
          membar · v0.1
        </div>
      </div>

      {signInOpen && <SignInSheet onClose={() => setSignInOpen(false)} />}
      {paywallOpen && (
        <PaywallSheet reason={null} onClose={() => setPaywallOpen(false)} />
      )}
    </main>
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
    <section className="mt-6">
      <h2 className="mb-2 text-[13px] font-semibold text-paper/55">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-paper/10 bg-surface px-3 py-3.5 text-center">
      <div className="text-[22px] font-bold tabular-nums text-paper">
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-paper/55">{label}</div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[14px] font-medium text-paper">{label}</span>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-paper/8" />;
}

function LegalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-paper/4"
    >
      <span className="text-[14px] font-medium text-paper">{children}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className="text-paper/40"
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
