"use client";

import { useState } from "react";
import IosInstallGuide from "./IosInstallGuide";
import { useInstall } from "@/lib/installContext";

export default function InstallButton() {
  const { canInstall, isIOS, isInstalled, install } = useInstall();
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  if (isInstalled) {
    return <span className="text-[12.5px] font-semibold text-gold">설치됨 ✓</span>;
  }

  if (canInstall) {
    return (
      <button
        onClick={() => void install()}
        className="rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-gold-soft"
      >
        설치하기
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setIosGuideOpen(true)}
          className="rounded-md bg-gold/12 px-3 py-1.5 text-[12.5px] font-semibold text-gold hover:bg-gold/18"
        >
          설치 방법
        </button>
        {iosGuideOpen && (
          <IosInstallGuide onClose={() => setIosGuideOpen(false)} />
        )}
      </>
    );
  }

  return (
    <span className="text-[12.5px] text-paper/45">이 브라우저는 미지원</span>
  );
}
