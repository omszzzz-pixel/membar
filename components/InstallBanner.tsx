"use client";

import { useEffect, useState } from "react";
import IosInstallGuide from "./IosInstallGuide";
import { useInstall } from "@/lib/installContext";

const SNOOZE_KEY = "membar_install_banner_snooze";
const MIN_VISITS = 3;
const SNOOZE_DAYS = 10;

export default function InstallBanner() {
  const { canInstall, isIOS, isInstalled, visits, install } = useInstall();
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SNOOZE_KEY);
      if (raw) setSnoozedUntil(parseInt(raw, 10));
    } catch {
      // ignore
    }
  }, []);

  const now = Date.now();
  const snoozed = snoozedUntil !== null && now < snoozedUntil;
  const eligible = !isInstalled && (canInstall || isIOS);
  const shouldShow =
    eligible && !snoozed && !hidden && visits >= MIN_VISITS;

  if (!shouldShow) return null;

  const dismiss = () => {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(SNOOZE_KEY, String(until));
    } catch {
      // ignore
    }
    setHidden(true);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setIosGuideOpen(true);
      return;
    }
    const ok = await install();
    if (ok) setHidden(true);
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-gold/25 bg-gold/10 px-4 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold text-[18px] font-black text-white">
          m
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-paper">
            홈 화면에 앱처럼 설치하기
          </div>
          <div className="text-[11.5px] text-paper/60">
            한 번에 열고 더 빠르게 기록
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-gold-soft"
        >
          {isIOS ? "방법 보기" : "설치"}
        </button>
        <button
          onClick={dismiss}
          aria-label="배너 닫기"
          className="shrink-0 rounded-full p-1 text-paper/50 transition hover:bg-paper/10"
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
      {iosGuideOpen && (
        <IosInstallGuide onClose={() => setIosGuideOpen(false)} />
      )}
    </>
  );
}
