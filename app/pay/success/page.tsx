"use client";

import Link from "next/link";

export default function PaySuccessPage() {
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
