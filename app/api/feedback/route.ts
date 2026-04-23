import { NextResponse } from "next/server";
import { sendTelegram, fmtUser, fmtText } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId, email, name, message } = (await req.json()) as {
      userId?: string | null;
      email?: string | null;
      name?: string | null;
      message?: string;
    };

    const text = (message ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "too long" }, { status: 400 });
    }

    const who = fmtUser({ id: userId, email, name });
    await sendTelegram(
      `📝 <b>피드백</b>\nfrom ${who}\n\n${fmtText(text, 1800)}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
