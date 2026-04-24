"use client";

export type InAppBrowser =
  | "kakaotalk"
  | "instagram"
  | "facebook"
  | "threads"
  | "line"
  | "naver"
  | "daum"
  | "other"
  | null;

/**
 * Detect whether the current user agent is an in-app browser that cannot
 * install PWAs. Returns the name of the in-app browser, or null if it's a
 * real browser (Safari/Chrome/Edge/Firefox).
 */
export function detectInAppBrowser(): InAppBrowser {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";

  if (/KAKAOTALK/i.test(ua)) return "kakaotalk";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/Threads/i.test(ua)) return "threads";
  if (/FBAN|FBAV|FB_IAB|FB4A/i.test(ua)) return "facebook";
  if (/Line\//i.test(ua)) return "line";
  if (/NAVER\(inapp/i.test(ua)) return "naver";
  if (/Daum/i.test(ua)) return "daum";

  // Generic WKWebView / Android WebView detection (likely inside another app)
  // Real Safari has 'Safari/' and no 'CriOS'. In-app on iOS usually lacks both.
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  if (isIOS) {
    const isRealSafari =
      /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const isChromeiOS = /CriOS/.test(ua);
    if (!isRealSafari && !isChromeiOS) return "other";
  }
  if (isAndroid) {
    // Android Chrome has 'Chrome/' and 'Safari/'. Real Chrome doesn't have 'wv'.
    // WebView has 'wv;' in UA.
    if (/; wv\)/.test(ua)) return "other";
  }

  return null;
}

export function inAppBrowserLabel(kind: InAppBrowser): string {
  switch (kind) {
    case "kakaotalk":
      return "카카오톡";
    case "instagram":
      return "인스타그램";
    case "threads":
      return "스레드";
    case "facebook":
      return "페이스북";
    case "line":
      return "라인";
    case "naver":
      return "네이버";
    case "daum":
      return "다음";
    case "other":
      return "인앱브라우저";
    default:
      return "";
  }
}
