import crypto from "crypto";

const MID = process.env.KORPAY_MID || "";
const MKEY = process.env.KORPAY_MKEY || "";
const INIT_URL =
  process.env.KORPAY_INIT_URL ||
  "https://pgapi.korpay.com/payInit_hash.korpay?uiType=iframe";
const CANCEL_URL = "https://pgapi.korpay.com/api/cancel";

export const PLANS = {
  "1m": { amount: 4990, label: "1개월", days: 30 },
  "6m": { amount: 24900, label: "6개월", days: 180 },
  "12m": { amount: 39900, label: "12개월", days: 365 },
} as const;

export type PlanId = keyof typeof PLANS;

export function getMid(): string {
  return MID;
}
export function getInitUrl(): string {
  return INIT_URL;
}
export function getCancelUrl(): string {
  return CANCEL_URL;
}

/**
 * SHA256 hex of (MID + ediDate + amt + MKEY).
 * 코페이 결제 요청 시 hashStr 필드.
 */
export function calcRequestHash(ediDate: string, amt: number): string {
  return crypto
    .createHash("sha256")
    .update(MID + ediDate + String(amt) + MKEY)
    .digest("hex");
}

/**
 * 코페이가 returnUrl POST 시 보내주는 hash 검증.
 * SHA256(mid + ordNo + amount + appNo).
 * 위변조 방지용.
 */
export function verifyReturnHash(
  ordNo: string,
  amount: number,
  appNo: string,
  hash: string
): boolean {
  const expected = crypto
    .createHash("sha256")
    .update(MID + ordNo + String(amount) + appNo)
    .digest("hex");
  return expected === hash;
}

/** YYYYMMDDHHmmss in KST. */
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

/** 30자 이하의 유니크 주문번호. */
export function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase(); // ~9 chars
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase(); // 8 chars
  return `MB${ts}${rand}`;
}
