"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Platform = "ios" | "android" | "desktop" | "unknown";
export type Browser =
  | "chrome"
  | "edge"
  | "samsung"
  | "safari"
  | "firefox"
  | "kakao"
  | "instagram"
  | "threads"
  | "facebook"
  | "line"
  | "naver"
  | "daum"
  | "webview-other"
  | "unknown";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = {
  ready: boolean;
  platform: Platform;
  browser: Browser;
  /** 인앱브라우저(카톡/인스타 등): 직접 PWA 설치 불가, 외부 브라우저 유도 필요 */
  inApp: boolean;
  /** 이미 설치되어 PWA(standalone) 모드로 실행 중 */
  isStandalone: boolean;
  /** Chrome/Edge가 beforeinstallprompt를 띄워준 상태 — 원클릭 가능 */
  canPrompt: boolean;
  /** 이론적으로 PWA 설치 가능한 환경 (단계별 가이드 가능) */
  canInstall: boolean;
  /** 원클릭 설치 트리거 (canPrompt일 때만 true 반환) */
  install: () => Promise<boolean>;
};

const InstallContext = createContext<InstallState | null>(null);

function detectPlatform(ua: string): Platform {
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Win|Mac|Linux|CrOS/.test(ua)) return "desktop";
  return "unknown";
}

function detectBrowser(ua: string): { browser: Browser; inApp: boolean } {
  if (/KAKAOTALK/i.test(ua)) return { browser: "kakao", inApp: true };
  if (/Instagram/i.test(ua)) return { browser: "instagram", inApp: true };
  if (/Threads/i.test(ua)) return { browser: "threads", inApp: true };
  if (/FBAN|FBAV|FB_IAB|FB4A/i.test(ua))
    return { browser: "facebook", inApp: true };
  if (/Line\//i.test(ua)) return { browser: "line", inApp: true };
  if (/NAVER\(inapp/i.test(ua)) return { browser: "naver", inApp: true };
  if (/Daum/i.test(ua)) return { browser: "daum", inApp: true };

  if (/SamsungBrowser/i.test(ua)) return { browser: "samsung", inApp: false };
  if (/Edg\//i.test(ua)) return { browser: "edge", inApp: false };
  if (/Firefox\//i.test(ua)) return { browser: "firefox", inApp: false };

  const isIOS = /iPad|iPhone|iPod/.test(ua);
  if (isIOS) {
    // iOS Chrome (CriOS), Edge (EdgiOS), Firefox (FxiOS) — all WebKit
    if (/CriOS/.test(ua)) return { browser: "chrome", inApp: false };
    if (/EdgiOS/.test(ua)) return { browser: "edge", inApp: false };
    if (/FxiOS/.test(ua)) return { browser: "firefox", inApp: false };
    if (/Safari\//.test(ua)) return { browser: "safari", inApp: false };
    return { browser: "webview-other", inApp: true };
  }

  // Android WebView ('wv')
  if (/Android/.test(ua) && /; wv\)/.test(ua)) {
    return { browser: "webview-other", inApp: true };
  }

  if (/Chrome\//.test(ua)) return { browser: "chrome", inApp: false };
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua))
    return { browser: "safari", inApp: false };
  return { browser: "unknown", inApp: false };
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari 'standalone' property
  return Boolean(
    (window.navigator as unknown as { standalone?: boolean }).standalone
  );
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [browser, setBrowser] = useState<Browser>("unknown");
  const [inApp, setInApp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    setPlatform(detectPlatform(ua));
    const { browser: b, inApp: ia } = detectBrowser(ua);
    setBrowser(b);
    setInApp(ia);
    setIsStandalone(detectStandalone());
    setReady(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsStandalone(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const result = await deferred.userChoice;
      if (result.outcome === "accepted") {
        setDeferred(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferred]);

  const canPrompt = !!deferred && !isStandalone;
  const canInstall =
    !isStandalone &&
    !inApp &&
    (canPrompt ||
      (platform === "ios" && browser === "safari") ||
      (platform === "android" &&
        (browser === "chrome" || browser === "samsung" || browser === "edge")) ||
      (platform === "desktop" &&
        (browser === "chrome" || browser === "edge")));

  return (
    <InstallContext.Provider
      value={{
        ready,
        platform,
        browser,
        inApp,
        isStandalone,
        canPrompt,
        canInstall,
        install,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall(): InstallState {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error("InstallProvider missing");
  return ctx;
}
