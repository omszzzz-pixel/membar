"use client";

import { useEffect, useState } from "react";
import { useInstall } from "@/lib/installContext";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

type Props = { onClose: () => void };

const BROWSER_NAME: Record<string, string> = {
  kakao: "카카오톡",
  instagram: "인스타그램",
  threads: "스레드",
  facebook: "페이스북",
  line: "라인",
  naver: "네이버",
  daum: "다음",
  "webview-other": "인앱 브라우저",
};

export default function InstallGuide({ onClose }: Props) {
  useLockBodyScroll();
  const { platform, browser, inApp } = useInstall();
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined" ? window.location.href : "https://membar.kr";

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
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("이 주소를 복사해 브라우저에 붙여넣으세요", url);
    }
  };

  return (
    <div
      className="anim-fade-in fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="anim-sheet-up w-full max-w-[430px] rounded-t-2xl bg-surface p-5 pb-7 sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-[17px] font-bold text-paper">앱으로 설치</div>
            <div className="mt-0.5 text-[12.5px] text-paper/55">
              홈 화면에 아이콘 추가 · 주소창 없는 풀스크린
            </div>
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

        {inApp ? (
          <InAppGuide
            browserName={BROWSER_NAME[browser] ?? "이 앱"}
            url={url}
            copied={copied}
            onCopy={copy}
            browser={browser}
          />
        ) : (
          <PlatformGuide platform={platform} browser={browser} />
        )}
      </div>
    </div>
  );
}

function InAppGuide({
  browserName,
  url,
  copied,
  onCopy,
  browser,
}: {
  browserName: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
  browser: string;
}) {
  return (
    <>
      <div className="mb-4 rounded-lg border border-terra/25 bg-terra/8 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-terra">
        <b>{browserName}</b>에서는 앱 설치가 안 돼요. 외부 브라우저로 열어
        주세요.
      </div>

      <ol className="space-y-3 text-[14px] text-paper/85">
        <Step num={1}>
          {browser === "kakao" && (
            <>
              화면 우측 상단 <b>⋮ 메뉴</b> → <b>다른 브라우저로 열기</b>
            </>
          )}
          {(browser === "instagram" || browser === "threads") && (
            <>
              화면 우측 상단 <b>⋯ 메뉴</b> →{" "}
              <b>외부 브라우저에서 열기</b>
            </>
          )}
          {browser === "line" && (
            <>
              우측 상단 <b>공유 아이콘</b> → <b>기본 브라우저로 열기</b>
            </>
          )}
          {(browser === "naver" || browser === "daum") && (
            <>
              우측 상단 <b>⋮ 메뉴</b> → <b>기본 브라우저에서 열기</b>
            </>
          )}
          {browser === "facebook" && (
            <>
              우측 상단 <b>⋯ 메뉴</b> → <b>외부 브라우저에서 열기</b>
            </>
          )}
          {browser === "webview-other" && (
            <>
              메뉴에서 <b>다른 브라우저로 열기</b> 또는 아래 주소를 복사해{" "}
              <b>Safari</b>(iPhone) / <b>Chrome</b>(Android)에서 직접 열기
            </>
          )}
        </Step>
        <Step num={2}>외부 브라우저(Safari/Chrome) 열리면 다시 설치 진행</Step>
      </ol>

      <div className="mt-4 rounded-lg border border-paper/10 bg-ink/40 p-3">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-paper/45">
          현재 주소
        </div>
        <div className="break-all font-mono text-[12.5px] text-paper/80">
          {url}
        </div>
        <button
          onClick={onCopy}
          className="mt-3 w-full rounded-md bg-gold py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-gold-soft"
        >
          {copied ? "복사됨 ✓" : "주소 복사"}
        </button>
      </div>
    </>
  );
}

function PlatformGuide({
  platform,
  browser,
}: {
  platform: string;
  browser: string;
}) {
  if (platform === "ios" && browser === "safari") {
    return (
      <ol className="space-y-3 text-[14px] text-paper/85">
        <Step num={1}>
          하단의 <ShareIcon /> <b>공유</b> 버튼 탭
        </Step>
        <Step num={2}>
          <b>홈 화면에 추가</b> 선택
        </Step>
        <Step num={3}>
          오른쪽 상단 <b>추가</b> 누르면 완료
        </Step>
      </ol>
    );
  }

  if (platform === "ios") {
    return (
      <div className="space-y-3 text-[14px] text-paper/85">
        <div className="rounded-lg border border-terra/25 bg-terra/8 px-3.5 py-2.5 text-[13px] text-terra">
          iPhone에선 <b>Safari로 열어야</b> 앱 설치 가능해요. (Chrome 등 다른
          브라우저는 미지원)
        </div>
        <ol className="space-y-3">
          <Step num={1}>이 주소를 복사 → Safari 앱 실행</Step>
          <Step num={2}>
            Safari에서 주소창 붙여넣고 이동 → 하단 <ShareIcon /> 공유 →{" "}
            <b>홈 화면에 추가</b>
          </Step>
        </ol>
      </div>
    );
  }

  if (
    platform === "android" &&
    (browser === "chrome" || browser === "samsung" || browser === "edge")
  ) {
    return (
      <ol className="space-y-3 text-[14px] text-paper/85">
        <Step num={1}>
          우측 상단 <b>⋮ 메뉴</b> 탭
        </Step>
        <Step num={2}>
          <b>앱 설치</b> 또는 <b>홈 화면에 추가</b> 선택
        </Step>
        <Step num={3}>
          팝업에서 <b>설치</b> 누르면 홈 화면에 아이콘 생김
        </Step>
      </ol>
    );
  }

  if (platform === "desktop" && (browser === "chrome" || browser === "edge")) {
    return (
      <ol className="space-y-3 text-[14px] text-paper/85">
        <Step num={1}>
          주소창 오른쪽 끝 <InstallIconBox /> <b>설치 아이콘</b> 클릭
        </Step>
        <Step num={2}>
          안 보이면 <b>⋮ 메뉴 → 앱 설치 → membar</b>
        </Step>
        <Step num={3}>
          <b>설치</b> 누르면 독/시작메뉴에 추가됨
        </Step>
      </ol>
    );
  }

  return (
    <div className="space-y-3 text-[14px] text-paper/85">
      <div className="rounded-lg border border-terra/25 bg-terra/8 px-3.5 py-2.5 text-[13px] text-terra">
        이 브라우저는 PWA 설치를 지원하지 않아요.
      </div>
      <ol className="space-y-3">
        <Step num={1}>
          <b>Safari</b>(iPhone) 또는 <b>Chrome/Edge</b>(Android · 데스크탑)로
          열기
        </Step>
        <Step num={2}>해당 브라우저에서 다시 설치 진행</Step>
      </ol>
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

function InstallIconBox() {
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
