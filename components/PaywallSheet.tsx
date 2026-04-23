"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/userContext";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { GUEST_HARD_LIMIT, MONTHLY_MEMO_LIMIT } from "@/lib/types";

type Plan = {
  id: "1m" | "6m" | "12m";
  label: string;
  price: number;
  monthly: number;
  discount?: string;
  recommended?: boolean;
};

const PLANS: Plan[] = [
  { id: "1m", label: "1개월", price: 4990, monthly: 4990 },
  {
    id: "6m",
    label: "6개월",
    price: 24900,
    monthly: 4150,
    discount: "17% 할인",
  },
  {
    id: "12m",
    label: "12개월",
    price: 39900,
    monthly: 3325,
    discount: "33% 할인",
    recommended: true,
  },
];

type Props = {
  reason?: "persons" | "memos" | null;
  onClose: () => void;
};

function formatWon(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export default function PaywallSheet({ reason, onClose }: Props) {
  useLockBodyScroll();
  const { authed, signInWithKakao } = useUser();
  const [selected, setSelected] = useState<Plan["id"]>("12m");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hook =
    reason === "persons"
      ? `무료 인원 ${GUEST_HARD_LIMIT}명을 다 썼어요`
      : reason === "memos"
      ? `이번 달 메모 ${MONTHLY_MEMO_LIMIT}개를 다 썼어요`
      : null;

  const handlePay = async () => {
    if (!authed) {
      alert("로그인 후 결제할 수 있어요");
      return;
    }
    alert("결제는 추후 연결 예정이에요");
  };

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up flex w-full max-w-[430px] max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-surface sm:rounded-2xl">
        <div className="flex items-start justify-between px-5 pb-3 pt-5">
          <div className="min-w-0 flex-1">
            {hook && (
              <div className="mb-1 text-[12px] font-semibold text-terra">
                {hook}
              </div>
            )}
            <div className="text-[20px] font-bold text-paper">
              Pro로 업그레이드하세요
            </div>
            <div className="mt-1 text-[13px] leading-relaxed text-paper/65">
              무제한 인맥 · 무제한 메모 · 우선 AI
            </div>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 -mt-1 shrink-0 rounded-lg p-2 text-paper/55 transition hover:bg-paper/8"
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

        <div className="overflow-y-auto px-5 pb-5 scrollbar-none">
          <div className="mt-1 flex items-center gap-2 rounded-lg bg-gold/10 px-3.5 py-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-gold"
            >
              <path
                d="M12 2l2.5 5.5 6 .6-4.5 4 1.3 5.9L12 15l-5.3 3 1.3-5.9-4.5-4 6-.6L12 2z"
                fill="currentColor"
              />
            </svg>
            <div className="text-[12.5px] font-semibold text-gold">
              런칭 기념 · 첫 3개월 특가
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-paper/10 bg-surface">
            <div className="grid grid-cols-3 border-b border-paper/8 text-[12px]">
              <div className="px-3 py-2.5 font-semibold text-paper/55">
                항목
              </div>
              <div className="px-3 py-2.5 text-center font-semibold text-paper/55">
                무료
              </div>
              <div className="px-3 py-2.5 text-center font-bold text-gold">
                Pro
              </div>
            </div>
            {[
              ["인원", `${GUEST_HARD_LIMIT}명`, "무제한"],
              ["메모", `월 ${MONTHLY_MEMO_LIMIT}개`, "무제한"],
              ["브리핑", "제한 있음", "무제한"],
            ].map(([k, a, b]) => (
              <div
                key={k}
                className="grid grid-cols-3 border-b border-paper/6 text-[13px] last:border-b-0"
              >
                <div className="px-3 py-2.5 font-medium text-paper/70">{k}</div>
                <div className="px-3 py-2.5 text-center text-paper/55">{a}</div>
                <div className="px-3 py-2.5 text-center font-semibold text-paper">
                  {b}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            {PLANS.map((p) => {
              const active = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                    active
                      ? "border-gold bg-gold/8"
                      : "border-paper/10 hover:border-paper/25"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? "border-gold bg-gold" : "border-paper/25"
                    }`}
                  >
                    {active && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-bold text-paper">
                        {p.label}
                      </span>
                      {p.recommended && (
                        <span className="rounded bg-gold px-1.5 py-[1px] text-[10.5px] font-bold text-white">
                          추천
                        </span>
                      )}
                      {p.discount && (
                        <span className="text-[11.5px] font-semibold text-gold">
                          {p.discount}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] text-paper/55">
                      월 {formatWon(p.monthly)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[15px] font-bold tabular-nums text-paper">
                      {formatWon(p.price)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!authed && (
            <div className="mt-4 rounded-lg border border-paper/10 bg-paper/4 px-4 py-3.5">
              <div className="mb-2 text-[12.5px] font-semibold text-paper/70">
                먼저 로그인이 필요해요
              </div>
              <button
                onClick={signInWithKakao}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] py-2.5 text-[13.5px] font-semibold text-[#191919] hover:brightness-95"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 2C4.58 2 1 4.82 1 8.3c0 2.24 1.48 4.2 3.68 5.3l-.94 3.44c-.06.22.2.4.4.28L8.1 15.3c.3.03.6.04.9.04 4.42 0 8-2.82 8-6.3S13.42 2 9 2z"
                    fill="currentColor"
                  />
                </svg>
                카카오로 계속하기
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-paper/8 bg-surface px-5 py-3">
          <button
            onClick={handlePay}
            disabled={!authed}
            className="w-full rounded-lg bg-gold py-3.5 text-[15px] font-semibold text-white transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-45"
          >
            {authed
              ? `${PLANS.find((p) => p.id === selected)?.label} 시작하기`
              : "로그인 후 결제"}
          </button>
          <div className="mt-2 text-center text-[11px] text-paper/45">
            언제든 해지 가능 · 카드 즉시 취소
          </div>
        </div>
      </div>
    </div>
  );
}
