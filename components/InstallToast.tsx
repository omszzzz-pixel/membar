"use client";

import { useEffect, useState } from "react";
import InstallGuide from "./InstallGuide";
import { useInstall } from "@/lib/installContext";

const AUTO_DISMISS_MS = 6500;

type Props = {
  onClose: () => void;
};

export default function InstallToast({ onClose }: Props) {
  const { canInstall, isInstalled, install } = useInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (canInstall) {
      const ok = await install();
      if (ok) {
        onClose();
        return;
      }
    }
    setGuideOpen(true);
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-40 mx-auto flex max-w-[430px] justify-center px-4">
        <div className="anim-sheet-up pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-paper/12 bg-surface px-4 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold text-[16px] font-black text-white">
            m
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-paper">
              잘 저장됐어요
            </div>
            <div className="text-[12px] text-paper/60">
              앱으로 설치하면 매일 빠르게 열 수 있어요
            </div>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-gold-soft"
          >
            설치
          </button>
          <button
            onClick={onClose}
            aria-label="닫기"
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
      </div>
      {guideOpen && <InstallGuide onClose={() => setGuideOpen(false)} />}
    </>
  );
}
