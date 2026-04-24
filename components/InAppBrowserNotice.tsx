"use client";

import { useEffect, useState } from "react";
import {
  detectInAppBrowser,
  inAppBrowserLabel,
  type InAppBrowser,
} from "@/lib/inAppBrowser";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const DISMISS_KEY = "membar_inapp_dismissed";

export default function InAppBrowserNotice() {
  const [kind, setKind] = useState<InAppBrowser>(null);
  const [dismissed, setDismissed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const k = detectInAppBrowser();
    setKind(k);
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  if (!kind || dismissed) return null;

  const onDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <>
      <button
        onClick={() => setGuideOpen(true)}
        className="flex w-full items-center gap-2.5 border-b border-gold/25 bg-gold/10 px-4 py-2.5 text-left transition hover:bg-gold/14"
      >
        <span className="text-[16px]">📱</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold text-paper">
            {inAppBrowserLabel(kind)}에서 열렸어요
          </span>
          <span className="mt-[1px] block text-[11.5px] text-paper/60">
            탭해서 크롬·사파리로 열어 앱처럼 쓰세요
          </span>
        </span>
        <span className="shrink-0 rounded-md bg-gold px-2.5 py-1 text-[11.5px] font-bold text-white">
          열기
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
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
        </span>
      </button>
      {guideOpen && (
        <InAppGuide kind={kind} onClose={() => setGuideOpen(false)} />
      )}
    </>
  );
}

function InAppGuide({
  kind,
  onClose,
}: {
  kind: InAppBrowser;
  onClose: () => void;
}) {
  useLockBodyScroll();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select + prompt
      prompt("이 주소를 복사해 브라우저에 붙여넣으세요", url);
    }
  };

  const steps = getSteps(kind);

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[80] flex items-end justify-center bg-black/55 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up w-full max-w-[430px] rounded-t-2xl bg-surface p-5 pb-7 sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div className="text-[17px] font-bold text-paper">
            크롬·사파리에서 열기
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

        <div className="mb-4 text-[13px] leading-relaxed text-paper/70">
          {inAppBrowserLabel(kind)} 안에선 앱으로 설치가 안 돼요. 아래 순서로
          열면 됩니다.
        </div>

        <div className="rounded-lg border border-paper/10 bg-ink/40 p-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-paper/45">
            현재 주소
          </div>
          <div className="break-all text-[13px] font-mono text-paper/85">
            {url}
          </div>
          <button
            onClick={copy}
            className="mt-3 w-full rounded-md bg-gold py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-gold-soft"
          >
            {copied ? "복사됨 ✓" : "주소 복사"}
          </button>
        </div>

        <ol className="mt-5 space-y-3 text-[13.5px] text-paper/85">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-[12px] font-bold text-white">
                {i + 1}
              </span>
              <div className="flex-1 leading-relaxed">{s}</div>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-lg bg-paper/5 px-3.5 py-2.5 text-[12px] leading-relaxed text-paper/60">
          💡 외부 브라우저로 열면 홈 화면에 아이콘으로 설치해서 앱처럼 쓸 수
          있어요.
        </div>
      </div>
    </div>
  );
}

function getSteps(kind: InAppBrowser): React.ReactNode[] {
  switch (kind) {
    case "kakaotalk":
      return [
        <>
          화면 우측 상단 <b>⋯ 메뉴</b>를 탭
        </>,
        <>
          <b>&ldquo;다른 브라우저로 열기&rdquo;</b> 선택
        </>,
        <>Safari/Chrome에서 열리면 주소창 옆 설치 아이콘으로 앱 설치</>,
      ];
    case "instagram":
    case "threads":
      return [
        <>
          화면 우측 상단 <b>⋯ 메뉴</b>를 탭
        </>,
        <>
          <b>&ldquo;외부 브라우저에서 열기&rdquo;</b> 또는{" "}
          <b>&ldquo;Chrome/Safari에서 열기&rdquo;</b> 선택
        </>,
        <>열린 브라우저에서 앱 설치 가이드 따르기</>,
      ];
    case "facebook":
      return [
        <>
          화면 우측 상단 <b>⋯ 메뉴</b>를 탭
        </>,
        <>
          <b>&ldquo;외부 브라우저에서 열기&rdquo;</b> 선택
        </>,
        <>Safari/Chrome에서 홈 화면 추가</>,
      ];
    case "line":
      return [
        <>
          화면 우측 상단 <b>⋯ 또는 공유 아이콘</b> 탭
        </>,
        <>
          <b>&ldquo;기본 브라우저로 열기&rdquo;</b> 선택
        </>,
        <>Safari/Chrome에서 앱 설치</>,
      ];
    case "naver":
    case "daum":
      return [
        <>
          우측 상단 <b>⋯ 메뉴</b> 탭
        </>,
        <>
          <b>&ldquo;기본 브라우저에서 열기&rdquo;</b> 선택
        </>,
        <>Safari/Chrome에서 앱 설치</>,
      ];
    default:
      return [
        <>주소창이 있다면 위 &ldquo;주소 복사&rdquo; 버튼 탭</>,
        <>
          <b>Safari</b>(iPhone) 또는 <b>Chrome</b>(Android) 앱을 직접 실행
        </>,
        <>주소창에 붙여넣고 이동 → 앱 설치</>,
      ];
  }
}
