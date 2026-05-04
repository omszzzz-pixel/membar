import { NextResponse } from "next/server";
import { sendTelegram, fmtUser, fmtText } from "@/lib/telegram";

export const runtime = "nodejs";

type EventName =
  | "visit"
  | "login_click"
  | "memo_open"
  | "briefing_open"
  | "signup"
  | "paywall_open"
  | "payment_attempt"
  | "payment_success";

type NotifyBody = {
  event: EventName;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  detail?: string | null;
};

const PREFIX: Record<EventName, string> = {
  visit: "👋 <b>방문</b>",
  login_click: "🔑 <b>로그인 클릭</b>",
  memo_open: "✏️ <b>메모창 열림</b>",
  briefing_open: "📋 <b>브리핑 열림</b>",
  signup: "🎉 <b>신규 가입</b>",
  paywall_open: "👀 <b>결제 시트 열림</b>",
  payment_attempt: "💳 <b>결제 시도</b>",
  payment_success: "✅ <b>결제 성공</b>",
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NotifyBody;
    if (!body?.event) {
      return NextResponse.json({ error: "event required" }, { status: 400 });
    }

    const who = fmtUser({ id: body.userId, email: body.email, name: body.name });
    const detail = body.detail ? `\n${fmtText(body.detail, 400)}` : "";
    const head = PREFIX[body.event] ?? `📣 <b>${body.event}</b>`;

    // Visit/login_click의 경우 게스트도 많아서 who 비어있을 수 있음 → "guest" 표시
    const whoOrGuest = body.userId || body.email || body.name ? who : "🟡 게스트";

    await sendTelegram(`${head}\n${whoOrGuest}${detail}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
