"use client";

import { useEffect, useMemo, useState } from "react";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

type Platform =
  | "ios"
  | "android-chrome"
  | "android-samsung"
  | "desktop-chrome"
  | "desktop-edge"
  | "desktop-safari"
  | "desktop-firefox"
  | "unknown";

function detect(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSamsung = /SamsungBrowser/.test(ua);
  const isEdge = /Edg\//.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  const isChrome = /Chrome\//.test(ua) && !isEdge && !isSamsung;
  const isSafari =
    /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Android/.test(ua);

  if (isIOS) return "ios";
  if (isSamsung) return "android-samsung";
  if (isAndroid) return "android-chrome";
  if (isEdge) return "desktop-edge";
  if (isFirefox) return "desktop-firefox";
  if (isSafari) return "desktop-safari";
  if (isChrome) return "desktop-chrome";
  return "unknown";
}

const TAB_LABELS: Record<"ios" | "android" | "desktop", string> = {
  ios: "iPhone",
  android: "Android",
  desktop: "데스크탑",
};

type Tab = "ios" | "android" | "desktop";

function platformToTab(p: Platform): Tab {
  if (p === "ios") return "ios";
  if (p === "android-chrome" || p === "android-samsung") return "android";
  return "desktop";
}

export default function InstallGuide({ onClose }: { onClose: () => void }) {
  useLockBodyScroll();
  const initial = useMemo(() => platformToTab(detect()), []);
  const [tab, setTab] = useState<Tab>(initial);

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
          <div className="text-[17px] font-bold text-paper">앱으로 설치하기</div>
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

        <div className="mb-4 flex gap-1.5 rounded-lg bg-paper/6 p-1">
          {(["ios", "android", "desktop"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition ${
                tab === t
                  ? "bg-surface text-paper shadow-sm"
                  : "text-paper/55 hover:text-paper/75"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "ios" && <IosSteps />}
        {tab === "android" && <AndroidSteps />}
        {tab === "desktop" && <DesktopSteps />}

        <div className="mt-4 rounded-lg bg-gold/8 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-gold">
          설치하면 홈 화면/독에 앱처럼 뜨고, 브라우저 주소창 없이 전체화면으로
          열려요.
        </div>
      </div>
    </div>
  );
}

function IosSteps() {
  return (
    <ol className="space-y-3 text-[14px] text-paper/85">
      <Step num={1}>
        <b>Safari</b>로 이 페이지를 여세요 · 크롬에서는 iPhone에선 설치가 안
        돼요
      </Step>
      <Step num={2}>
        하단의 <ShareIcon /> <b>공유</b> 버튼을 탭하세요
      </Step>
      <Step num={3}>
        <b>홈 화면에 추가</b>를 선택하세요
      </Step>
      <Step num={4}>
        오른쪽 상단 <b>추가</b>를 누르면 완료
      </Step>
    </ol>
  );
}

function AndroidSteps() {
  return (
    <ol className="space-y-3 text-[14px] text-paper/85">
      <Step num={1}>
        <b>Chrome</b> 또는 <b>삼성 인터넷</b>에서 페이지를 여세요
      </Step>
      <Step num={2}>
        오른쪽 상단 <MenuIcon /> <b>︙ 메뉴</b>를 누르세요
      </Step>
      <Step num={3}>
        <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 탭하세요
      </Step>
      <Step num={4}>
        팝업에서 <b>설치</b>를 누르면 홈 화면에 아이콘이 생겨요
      </Step>
    </ol>
  );
}

function DesktopSteps() {
  return (
    <ol className="space-y-3 text-[14px] text-paper/85">
      <Step num={1}>
        <b>Chrome</b> 또는 <b>Edge</b>에서 페이지를 여세요 · Safari·Firefox는
        PWA 설치를 지원하지 않아요
      </Step>
      <Step num={2}>
        주소창 오른쪽 끝의 <InstallIcon /> <b>설치 아이콘</b>을 클릭하세요
      </Step>
      <Step num={3}>
        안 보이면 오른쪽 상단 <b>︙ 메뉴 → 앱 설치 → membar</b>
      </Step>
      <Step num={4}>
        <b>설치</b> 버튼을 누르면 완료 — 독/시작메뉴에 앱처럼 추가돼요
      </Step>
    </ol>
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

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-paper/8 align-[-3px]">
      {children}
    </span>
  );
}

function ShareIcon() {
  return (
    <IconBox>
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
    </IconBox>
  );
}

function MenuIcon() {
  return (
    <IconBox>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="1.5" fill="currentColor" className="text-paper/75" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-paper/75" />
        <circle cx="12" cy="19" r="1.5" fill="currentColor" className="text-paper/75" />
      </svg>
    </IconBox>
  );
}

function InstallIcon() {
  return (
    <IconBox>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-paper/75"
        />
      </svg>
    </IconBox>
  );
}
