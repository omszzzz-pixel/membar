"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function PayFailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-[13.5px] text-paper/55">
          …
        </main>
      }
    >
      <FailInner />
    </Suspense>
  );
}

function FailInner() {
  const params = useSearchParams();
  const msg = params.get("msg") || "결제가 완료되지 않았어요.";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="text-[56px]">😔</div>
      <div className="mt-3 text-[22px] font-bold text-paper">결제 실패</div>
      <div className="mt-2 max-w-[300px] text-center text-[13.5px] leading-relaxed text-paper/65">
        {msg}
      </div>
      <Link
        href="/me"
        className="mt-7 rounded-lg bg-gold px-6 py-3 text-[14.5px] font-bold text-white hover:bg-gold-soft"
      >
        다시 시도하기
      </Link>
      <Link
        href="/"
        className="mt-3 text-[13px] font-semibold text-paper/55 hover:text-paper/80"
      >
        홈으로
      </Link>
    </main>
  );
}
