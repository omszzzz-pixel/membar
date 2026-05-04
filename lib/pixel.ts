"use client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Meta Pixel 표준 이벤트 이름 typed alias */
export type PixelEvent =
  | "PageView"
  | "Lead"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Purchase"
  | "Subscribe";

/**
 * Meta Pixel 이벤트 호출. window.fbq가 없으면(스크립트 미로드/차단) 조용히 무시.
 */
export function trackPixel(
  event: PixelEvent,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  try {
    if (params) {
      fbq("track", event, params);
    } else {
      fbq("track", event);
    }
  } catch {
    // ignore
  }
}
