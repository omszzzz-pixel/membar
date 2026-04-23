"use client";

import { useState } from "react";
import InstallGuide from "./InstallGuide";
import { useInstall } from "@/lib/installContext";

export default function InstallButton() {
  const { canInstall, isInstalled, install } = useInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isInstalled) {
    return <span className="text-[12.5px] font-semibold text-gold">설치됨 ✓</span>;
  }

  const handleClick = async () => {
    if (canInstall) {
      setBusy(true);
      try {
        const ok = await install();
        if (!ok) setGuideOpen(true); // User dismissed or API failed — show manual guide
      } finally {
        setBusy(false);
      }
      return;
    }
    setGuideOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy}
        className="rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-gold-soft disabled:opacity-60"
      >
        {busy ? "여는 중…" : "설치하기"}
      </button>
      {guideOpen && <InstallGuide onClose={() => setGuideOpen(false)} />}
    </>
  );
}
