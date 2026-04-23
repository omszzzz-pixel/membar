"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/userContext";

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
  const { signInWithKakao, signInWithGoogle } = useUser();
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
    try {
      await signInWithKakao();
    } catch {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
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

        <div className="space-y-2">
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
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-paper/15 bg-surface py-3.5 text-[14.5px] font-semibold text-paper transition hover:bg-paper/4 disabled:opacity-60"
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M21.35 12.23c0-.73-.07-1.43-.2-2.1H12v4h5.2c-.22 1.2-.9 2.2-1.92 2.87v2.4h3.1c1.82-1.67 2.97-4.15 2.97-7.17z"
              />
              <path
                fill="#34A853"
                d="M12 21c2.6 0 4.78-.86 6.37-2.33l-3.1-2.4c-.86.58-1.96.92-3.27.92-2.51 0-4.64-1.7-5.4-3.98H3.4v2.49C4.98 18.73 8.2 21 12 21z"
              />
              <path
                fill="#FBBC05"
                d="M6.6 13.21c-.2-.58-.3-1.2-.3-1.85s.1-1.27.3-1.85V7.02H3.4C2.82 8.16 2.5 9.52 2.5 11c0 1.48.32 2.84.9 3.98l3.2-1.77z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.42 0 2.69.49 3.69 1.45l2.75-2.75C16.78 2.48 14.6 1.5 12 1.5 8.2 1.5 4.98 3.77 3.4 7.02l3.2 2.49C7.36 7.08 9.49 5.38 12 5.38z"
              />
            </svg>
            Google로 계속하기
          </button>
        </div>

        <div className="mt-3 text-center text-[12px] text-paper/50">
          로그인하면 이미 기록해둔 인맥이 자동으로 연결돼요.
        </div>
      </div>
    </div>
  );
}
