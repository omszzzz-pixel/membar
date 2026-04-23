import { NextResponse } from "next/server";
import { sendTelegram, fmtUser, fmtText } from "@/lib/telegram";

export const runtime = "nodejs";

type NotifyBody = {
  event: "signup" | "paywall_open" | "payment_attempt" | "payment_success";
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  detail?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NotifyBody;
    if (!body?.event) {
      return NextResponse.json({ error: "event required" }, { status: 400 });
    }

    const who = fmtUser({ id: body.userId, email: body.email, name: body.name });
    const detail = body.detail ? `\n${fmtText(body.detail, 400)}` : "";

    const prefix: Record<NotifyBody["event"], string> = {
      signup: "🎉 <b>신규 가입</b>",
      paywall_open: "👀 <b>결제 시트 열림</b>",
      payment_attempt: "💳 <b>결제 시도</b>",
      payment_success: "✅ <b>결제 성공</b>",
    };
    const head = prefix[body.event] ?? `📣 <b>${body.event}</b>`;

    await sendTelegram(`${head}\n${who}${detail}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
