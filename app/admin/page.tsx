"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import { useUser } from "@/lib/userContext";

type Stats = {
  totalUsers: number;
  authedUsers: number;
  guestUsers: number;
  newAuthedThisWeek: number;
  totalPersons: number;
  totalMemos: number;
  memosToday: number;
  memosThisWeek: number;
  memosThisMonth: number;
};

type Activity = {
  id: string;
  personId: string;
  personName: string;
  userId: string | null;
  rawInput: string;
  createdAt: string;
};

type UserRow = {
  kind: "authed" | "guest";
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  personsCount: number;
  memosCount: number;
};

type Dashboard = {
  stats: Stats;
  activity: Activity[];
  users: UserRow[];
};

export default function AdminPage() {
  const { authed, email, signInWithKakao, loading: userLoading } = useUser();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!authed) return; // show login CTA, don't try fetching
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, authed]);

  const load = async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const sb = getBrowserSupabase();
      const { data: sessionData } = await sb.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setForbidden(true);
        return;
      }
      const res = await fetch("/api/admin/dashboard", {
        cache: "no-store",
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "불러오기 실패");
        return;
      }
      setData((await res.json()) as Dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    } finally {
      setLoading(false);
    }
  };

  if (!userLoading && !authed) {
    return (
      <main className="min-h-dvh px-4 pt-16 text-center">
        <div className="text-[18px] font-bold text-paper">관리자 전용</div>
        <div className="mt-2 text-[13.5px] text-paper/60">
          로그인이 필요해요.
        </div>
        <button
          onClick={signInWithKakao}
          className="mt-5 rounded-lg bg-gold px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-gold-soft"
        >
          카카오로 로그인
        </button>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="min-h-dvh px-4 pt-16 text-center">
        <div className="text-[18px] font-bold text-paper">접근 권한 없음</div>
        <div className="mt-2 text-[13.5px] text-paper/60">
          {email ?? "현재 계정"}은 관리자로 등록되어 있지 않아요.
        </div>
        <div className="mt-3 text-[12px] text-paper/40">
          ADMIN_EMAILS 환경변수에 이메일이 포함돼 있어야 해요.
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh px-4 pt-12 text-center">
        <div className="text-[16px] font-bold text-paper">불러오기 실패</div>
        <div className="mt-2 text-[13.5px] text-paper/60">{error}</div>
        <button
          onClick={load}
          className="mt-4 rounded-md bg-paper/6 px-4 py-2 text-[13px] font-semibold text-paper/75 hover:bg-paper/10"
        >
          다시 시도
        </button>
      </main>
    );
  }

  if (!data || loading) {
    return (
      <main className="min-h-dvh px-4 pt-12 text-center text-paper/50">
        데이터 불러오는 중…
      </main>
    );
  }

  const { stats, activity, users } = data;

  return (
    <main className="relative min-h-dvh pb-24">
      <header className="sticky top-0 z-10 border-b border-paper/8 bg-ink px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-paper">관리자</h1>
            <div className="mt-0.5 text-[12.5px] text-paper/55">
              membar 대시보드
            </div>
          </div>
          <button
            onClick={load}
            className="rounded-md bg-paper/6 px-3 py-1.5 text-[12.5px] font-semibold text-paper/75 transition hover:bg-paper/10"
          >
            새로고침
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Stats cards */}
        <Section title="개요">
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="전체 유저" value={stats.totalUsers} />
            <StatCard label="로그인 유저" value={stats.authedUsers} />
            <StatCard label="이번 주 신규" value={stats.newAuthedThisWeek} highlight />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <StatCard label="전체 인맥" value={stats.totalPersons} />
            <StatCard label="이번 달 메모" value={stats.memosThisMonth} />
            <StatCard label="오늘 메모" value={stats.memosToday} highlight />
          </div>
          <div className="mt-3 rounded-xl border border-paper/10 bg-surface px-4 py-3 text-[12.5px] text-paper/60">
            누적 메모 <span className="font-semibold text-paper">{stats.totalMemos}</span>개 ·
            이번 주 <span className="font-semibold text-paper">{stats.memosThisWeek}</span>개 ·
            게스트 유저 <span className="font-semibold text-paper">{stats.guestUsers}</span>명
          </div>
        </Section>

        {/* Recent activity */}
        <Section title={`최근 활동 · ${activity.length}`}>
          {activity.length === 0 ? (
            <Empty>기록 없음</Empty>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-paper/10 bg-surface px-3.5 py-2.5"
                >
                  <div className="flex items-baseline gap-2 text-[12px]">
                    <span className="font-semibold text-paper">
                      {a.personName}
                    </span>
                    <UserChip id={a.userId} />
                    <span className="ml-auto shrink-0 font-medium tabular-nums text-paper/45">
                      {formatRelTime(a.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-paper/85">
                    {a.rawInput}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Users */}
        <Section title={`유저 · ${users.length}`}>
          {users.length === 0 ? (
            <Empty>유저 없음</Empty>
          ) : (
            <ul className="space-y-1.5">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border border-paper/10 bg-surface px-3.5 py-2.5"
                >
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      u.kind === "authed" ? "bg-gold" : "bg-paper/25"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-paper">
                      {u.email ?? u.name ?? `게스트 ${u.id.slice(0, 8)}`}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-paper/55">
                      {u.kind === "authed"
                        ? `가입 ${formatDate(u.createdAt)}${
                            u.lastSignInAt
                              ? ` · 최근 접속 ${formatRelTime(
                                  u.lastSignInAt
                                )}`
                              : ""
                          }`
                        : "게스트"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[11.5px]">
                    <div className="font-semibold tabular-nums text-paper">
                      {u.personsCount}
                      <span className="ml-0.5 text-paper/45">명</span>
                    </div>
                    <div className="mt-0.5 tabular-nums text-paper/55">
                      {u.memosCount} 메모
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
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
    <section className="mt-6 first:mt-2">
      <h2 className="mb-2 text-[13px] font-semibold text-paper/60">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        highlight
          ? "border-gold/30 bg-gold/8"
          : "border-paper/10 bg-surface"
      }`}
    >
      <div
        className={`text-[20px] font-bold tabular-nums ${
          highlight ? "text-gold" : "text-paper"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11.5px] text-paper/55">{label}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-paper/4 px-4 py-5 text-center text-[13px] text-paper/50">
      {children}
    </div>
  );
}

function UserChip({ id }: { id: string | null }) {
  if (!id)
    return <span className="text-paper/40">· 게스트</span>;
  return (
    <span className="font-mono text-[11px] text-paper/45">
      · {id.slice(0, 8)}
    </span>
  );
}

function formatRelTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = 60 * 1000;
  const h = 60 * m;
  const day = 24 * h;
  if (diff < m) return "방금";
  if (diff < h) return `${Math.floor(diff / m)}분 전`;
  if (diff < day) return `${Math.floor(diff / h)}시간 전`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear().toString().slice(2)}.${String(
    d.getMonth() + 1
  ).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
