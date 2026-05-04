import crypto from "crypto";

const MERCHANT_ID = process.env.KORPAY_MID || "";
const MKEY = process.env.KORPAY_MKEY || "";
const BASE_URL =
  process.env.KORPAY_BASE_URL || "https://payments.korpay.com/v1";

export const KORPAY_BASE_URL = BASE_URL;

export const PLANS = {
  "1m": { amount: 4990, label: "1개월", days: 30 },
  "6m": { amount: 24900, label: "6개월", days: 180 },
  "12m": { amount: 39900, label: "12개월", days: 365 },
} as const;

export type PlanId = keyof typeof PLANS;

export function getMerchantId(): string {
  return MERCHANT_ID;
}

export function getBaseUrl(): string {
  return BASE_URL;
}

/**
 * SHA-256(merchantId + ediDate + amount + mkey).
 * 코페이 인증 결제 요청 시 hashKey 필드용.
 */
export function calcHashKey(ediDate: string, amount: number): string {
  return crypto
    .createHash("sha256")
    .update(MERCHANT_ID + ediDate + String(amount) + MKEY)
    .digest("hex");
}

/** YYYYMMDDHHmmss in KST. hashKey와 동일한 값을 ediDate로 보내야 함. */
export function ediDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  const h = String(kst.getUTCHours()).padStart(2, "0");
  const mi = String(kst.getUTCMinutes()).padStart(2, "0");
  const s = String(kst.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}${h}${mi}${s}`;
}

/** 영문·숫자만, 40자 이하의 unique orderNumber. */
export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `MB${ts}${rand}`.replace(/[^A-Z0-9]/g, "");
}

/**
 * 인증 성공 후 paymentKey로 결제 승인 요청.
 * Endpoint: POST {BASE_URL}/payments/confirm?paymentKey=xxx
 */
export async function confirmPayment(
  paymentKey: string
): Promise<{
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}> {
  const query = new URLSearchParams({ paymentKey }).toString();
  try {
    const res = await fetch(`${BASE_URL}/payments/confirm?${query}`, {
      method: "POST",
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: {
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
