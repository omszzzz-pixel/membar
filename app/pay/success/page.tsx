"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackPixel } from "@/lib/pixel";

export default function PaySuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-[13.5px] text-paper/55">
          …
        </main>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}

function SuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");
  const amount = Number(params.get("amount") ?? 0);
  const plan = params.get("plan");
  const firedRef = useRef(false);

  // Meta Pixel Purchase 이벤트 (한 번만)
  useEffect(() => {
    if (firedRef.current) return;
    if (!order || !amount) return;
    firedRef.current = true;
    trackPixel("Purchase", {
      value: amount,
      currency: "KRW",
      content_name: plan ? `membar_pro_${plan}` : "membar_pro",
      content_type: "product",
      content_ids: [order],
    });
  }, [order, amount, plan]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="text-[56px]">🎉</div>
      <div className="mt-3 text-[22px] font-bold text-paper">
        Pro 활성화 완료
      </div>
      <div className="mt-2 text-center text-[14px] leading-relaxed text-paper/65">
        membar Pro로 무제한 인맥과 메모를 사용하세요.<br />
        영수증은 등록된 이메일로 곧 도착해요.
      </div>
      {amount > 0 && (
        <div className="mt-3 text-[12.5px] text-paper/50">
          결제 금액 · {amount.toLocaleString()}원
        </div>
      )}
      <Link
        href="/"
        className="mt-7 rounded-lg bg-gold px-6 py-3 text-[14.5px] font-bold text-white hover:bg-gold-soft"
      >
        membar로 돌아가기
      </Link>
      <Link
        href="/me"
        className="mt-3 text-[13px] font-semibold text-paper/55 hover:text-paper/80"
      >
        구독 상태 확인
      </Link>
    </main>
  );
}
