"use client";

import { useState } from "react";
import InstallGuide from "./InstallGuide";
import { useInstall } from "@/lib/installContext";

type Variant = "compact" | "full";

export default function InstallButton({
  variant = "compact",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { ready, isStandalone, canPrompt, install } = useInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready) return null;

  if (isStandalone) {
    return (
      <span className="text-[12.5px] font-semibold text-gold">설치됨 ✓</span>
    );
  }

  const handleClick = async () => {
    if (canPrompt) {
      setBusy(true);
      try {
        const ok = await install();
        if (!ok) setGuideOpen(true);
      } finally {
        setBusy(false);
      }
      return;
    }
    setGuideOpen(true);
  };

  if (variant === "full") {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={busy}
          className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-[14.5px] font-bold text-white transition hover:bg-gold-soft disabled:opacity-60 ${
            className ?? ""
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {busy ? "여는 중…" : "앱으로 설치하기"}
        </button>
        {guideOpen && <InstallGuide onClose={() => setGuideOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy}
        className={`rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-gold-soft disabled:opacity-60 ${
          className ?? ""
        }`}
      >
        {busy ? "여는 중…" : "설치하기"}
      </button>
      {guideOpen && <InstallGuide onClose={() => setGuideOpen(false)} />}
    </>
  );
}
