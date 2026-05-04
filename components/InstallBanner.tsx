"use client";

import { useEffect, useState } from "react";
import InstallGuide from "./InstallGuide";
import { useInstall } from "@/lib/installContext";

const SNOOZE_KEY = "membar_install_banner_v3";
const SNOOZE_DAYS = 5;

export default function InstallBanner() {
  const { ready, isStandalone, inApp, canPrompt, canInstall, install, browser } =
    useInstall();
  const [hidden, setHidden] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SNOOZE_KEY);
      if (raw) setSnoozedUntil(parseInt(raw, 10));
    } catch {
      // ignore
    }
  }, []);

  if (!ready || isStandalone || hidden) return null;
  if (snoozedUntil && Date.now() < snoozedUntil) return null;
  // 인앱 + 설치 가능한 케이스가 아닌 unsupported는 표시 X
  if (!inApp && !canInstall) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(
        SNOOZE_KEY,
        String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000)
      );
    } catch {
      // ignore
    }
  };

  const onClick = async () => {
    if (canPrompt) {
      setBusy(true);
      try {
        const ok = await install();
        if (ok) setHidden(true);
        else setGuideOpen(true);
      } finally {
        setBusy(false);
      }
      return;
    }
    setGuideOpen(true);
  };

  const headline = inApp
    ? "외부 브라우저로 열어 앱 설치"
    : "membar 앱으로 설치";
  const sub = inApp
    ? `${browserName(browser)} 안에선 설치 안 돼요 · 탭해서 안내`
    : "주소창 없는 풀스크린 · 한 번만 설치하면 끝";

  return (
    <>
      <div className="flex items-center gap-3 border-b border-gold/25 bg-gold/10 px-4 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold text-[16px] font-black text-white">
          m
        </div>
        <button
          onClick={onClick}
          className="min-w-0 flex-1 text-left"
          disabled={busy}
        >
          <div className="text-[13px] font-semibold text-paper">
            {busy ? "여는 중…" : headline}
          </div>
          <div className="truncate text-[11.5px] text-paper/60">{sub}</div>
        </button>
        <button
          onClick={onClick}
          disabled={busy}
          className="shrink-0 rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-gold-soft disabled:opacity-60"
        >
          {inApp ? "안내" : "설치"}
        </button>
        <button
          onClick={dismiss}
          aria-label="닫기"
          className="shrink-0 rounded-full p-1 text-paper/45 transition hover:bg-paper/10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {guideOpen && <InstallGuide onClose={() => setGuideOpen(false)} />}
    </>
  );
}

function browserName(b: string): string {
  const map: Record<string, string> = {
    kakao: "카카오톡",
    instagram: "인스타그램",
    threads: "스레드",
    facebook: "페이스북",
    line: "라인",
    naver: "네이버",
    daum: "다음",
    "webview-other": "인앱브라우저",
  };
  return map[b] ?? "이 앱";
}
