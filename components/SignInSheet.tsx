"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/userContext";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

type Props = {
  title?: string;
  message?: string;
  dismissible?: boolean;
  onClose: () => void;
};

export default function SignInSheet({
  title = "로그인",
  message = "데이터를 안전하게 보관하고 여러 기기에서 이어 쓰려면 로그인하세요.",
  dismissible = true,
  onClose,
}: Props) {
  useLockBodyScroll();
  const { signInWithKakao } = useUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissible, onClose]);

  const handleKakao = async () => {
    setLoading(true);
    void fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "login_click",
        detail: title === "로그인" ? "메인 로그인" : title,
      }),
    }).catch(() => {});
    try {
      await signInWithKakao();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center"
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up w-full max-w-[430px] rounded-t-2xl bg-surface p-6 pb-8 sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-[18px] font-bold text-paper">{title}</div>
            <div className="mt-1 text-[13.5px] leading-relaxed text-paper/65">
              {message}
            </div>
          </div>
          {dismissible && (
            <button
              onClick={onClose}
              className="-mr-2 -mt-1 rounded-lg p-2 text-paper/55 transition hover:bg-paper/8"
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
          )}
        </div>

        <button
          onClick={handleKakao}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] py-3.5 text-[15px] font-semibold text-[#191919] transition hover:brightness-95 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2C4.58 2 1 4.82 1 8.3c0 2.24 1.48 4.2 3.68 5.3l-.94 3.44c-.06.22.2.4.4.28L8.1 15.3c.3.03.6.04.9.04 4.42 0 8-2.82 8-6.3S13.42 2 9 2z"
              fill="currentColor"
            />
          </svg>
          {loading ? "이동 중…" : "카카오로 계속하기"}
        </button>

        <div className="mt-3 text-center text-[12px] text-paper/50">
          로그인하면 이미 기록해둔 인맥이 자동으로 연결돼요.
        </div>

        <div className="mt-4 text-center text-[11.5px] leading-relaxed text-paper/45">
          로그인 시{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-paper/70"
          >
            이용약관
          </a>
          {" · "}
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-paper/70"
          >
            개인정보 처리방침
          </a>
          에 동의합니다.
        </div>
      </div>
    </div>
  );
}
