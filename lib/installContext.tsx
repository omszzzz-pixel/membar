"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = {
  canInstall: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  visits: number;
  install: () => Promise<boolean>;
};

const InstallContext = createContext<InstallState | null>(null);

const VISIT_KEY = "membar_visit_count";
const SESSION_FLAG = "membar_visit_counted_session";

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone (already installed)
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ||
      false;
    if (isStandalone) setInstalled(true);

    // Detect iOS
    const ua = window.navigator.userAgent;
    setIos(
      /iPad|iPhone|iPod/.test(ua) &&
        !(window as unknown as { MSStream?: unknown }).MSStream
    );

    // Count visits once per browser session
    try {
      const current = parseInt(
        localStorage.getItem(VISIT_KEY) || "0",
        10
      );
      if (!sessionStorage.getItem(SESSION_FLAG)) {
        sessionStorage.setItem(SESSION_FLAG, "1");
        const next = current + 1;
        localStorage.setItem(VISIT_KEY, String(next));
        setVisits(next);
      } else {
        setVisits(current);
      }
    } catch {
      // ignore storage errors
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
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

  return (
    <InstallContext.Provider
      value={{
        canInstall: !!deferred,
        isIOS: ios,
        isInstalled: installed,
        visits,
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
