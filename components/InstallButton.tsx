"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "loading" | "installable" | "installed" | "ios" | "unsupported";

export default function InstallButton() {
  const [mode, setMode] = useState<Mode>("loading");
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isStandalone) {
      setMode("installed");
      return;
    }

    const ua = window.navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    if (isIOS) {
      setMode("ios");
    } else {
      setMode("unsupported");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("installable");
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setMode("installed");
      setDeferred(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const result = await deferred.userChoice;
      if (result.outcome === "accepted") {
        setMode("installed");
        setDeferred(null);
      }
    } catch {
      // ignore
    }
  };

  if (mode === "loading") {
    return <span className="text-[12.5px] text-paper/40">확인 중</span>;
  }

  if (mode === "installed") {
    return (
      <span className="text-[12.5px] font-semibold text-gold">설치됨 ✓</span>
    );
  }

  if (mode === "installable") {
    return (
      <button
        onClick={handleInstall}
        className="rounded-md bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-gold-soft"
      >
        설치하기
      </button>
    );
  }

  if (mode === "ios") {
    return (
      <>
        <button
          onClick={() => setIosGuideOpen(true)}
          className="rounded-md bg-gold/12 px-3 py-1.5 text-[12.5px] font-semibold text-gold hover:bg-gold/18"
        >
          설치 방법
        </button>
        {iosGuideOpen && (
          <IosGuide onClose={() => setIosGuideOpen(false)} />
        )}
      </>
    );
  }

  return (
    <span className="text-[12.5px] text-paper/45">이 브라우저는 미지원</span>
  );
}

function IosGuide({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up w-full max-w-[430px] rounded-t-2xl bg-surface p-5 pb-6 sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div className="text-[17px] font-bold text-paper">
            홈 화면에 추가하기
          </div>
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
        </div>
        <ol className="space-y-3 text-[14px] text-paper/85">
          <Step num={1}>
            Safari 하단의{" "}
            <ShareIcon />{" "}
            <b>공유</b> 버튼을 탭하세요.
          </Step>
          <Step num={2}>
            <b>홈 화면에 추가</b>를 선택하세요.
          </Step>
          <Step num={3}>
            오른쪽 상단 <b>추가</b>를 누르면 홈 화면에 앱이 생깁니다.
          </Step>
        </ol>
        <div className="mt-4 rounded-lg bg-paper/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-paper/65">
          크롬 브라우저에서는 설치 버튼이 자동으로 떠요. Safari만 수동 추가가
          필요합니다.
        </div>
      </div>
    </div>
  );
}

function Step({
  num,
  children,
}: {
  num: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-[12px] font-bold text-white">
        {num}
      </span>
      <div className="flex-1 leading-relaxed">{children}</div>
    </li>
  );
}

function ShareIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-paper/8 align-[-3px]">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3v13M8 7l4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-paper/75"
        />
      </svg>
    </span>
  );
}
