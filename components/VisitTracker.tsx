"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/userContext";

const SESSION_KEY = "membar_visit_notified";
const UTM_KEY = "membar_utm";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

/**
 * 첫 방문 시 텔레그램 알림 + UTM 캡처.
 * 같은 세션에선 1회만 fire.
 * UTM 파라미터는 localStorage에 저장 → 이후 모든 알림에서 재활용.
 */
export default function VisitTracker() {
  const { authed, userId, email, name, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined") return;

    // UTM 캡처 (URL에 있으면 localStorage에 저장)
    try {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const f of UTM_FIELDS) {
        const v = params.get(f);
        if (v) utm[f] = v;
      }
      if (Object.keys(utm).length > 0) {
        localStorage.setItem(UTM_KEY, JSON.stringify(utm));
      }
    } catch {
      // ignore
    }

    // 세션당 1회만 visit 알림
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }

    // 디테일: UTM + 디바이스 + referrer
    const detail = buildVisitDetail();

    void fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "visit",
        userId: authed ? userId : null,
        email,
        name,
        detail,
      }),
    }).catch(() => {});
  }, [authed, userId, email, name, loading]);

  return null;
}

function buildVisitDetail(): string {
  const lines: string[] = [];

  // UTM
  try {
    const raw = localStorage.getItem(UTM_KEY);
    if (raw) {
      const utm = JSON.parse(raw) as Record<string, string>;
      const parts: string[] = [];
      if (utm.utm_source) parts.push(`source=${utm.utm_source}`);
      if (utm.utm_medium) parts.push(`medium=${utm.utm_medium}`);
      if (utm.utm_campaign) parts.push(`campaign=${utm.utm_campaign}`);
      if (utm.utm_content) parts.push(`content=${utm.utm_content}`);
      if (parts.length > 0) lines.push("📊 " + parts.join(" · "));
    }
  } catch {
    // ignore
  }

  // Referrer
  if (document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.host && refUrl.host !== window.location.host) {
        lines.push(`↩️ ref: ${refUrl.host}`);
      }
    } catch {
      // ignore
    }
  }

  // 디바이스 / 브라우저
  const ua = navigator.userAgent || "";
  const platform = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
    ? "Android"
    : /Mac/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
    ? "Windows"
    : "기타";
  let browser = "Unknown";
  if (/KAKAOTALK/i.test(ua)) browser = "카카오톡";
  else if (/Instagram/i.test(ua)) browser = "인스타그램";
  else if (/Threads/i.test(ua)) browser = "스레드";
  else if (/FBAN|FBAV/i.test(ua)) browser = "페이스북";
  else if (/Edg\//.test(ua)) browser = "Edge";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung";
  else if (/CriOS|Chrome/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua)) browser = "Safari";

  lines.push(`📱 ${platform} · ${browser}`);

  return lines.join("\n");
}
