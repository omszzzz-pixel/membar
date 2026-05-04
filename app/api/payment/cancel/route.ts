import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAdminFromRequest } from "@/lib/isAdmin";
import { getCancelUrl, getMid } from "@/lib/korpay";
import { revokePro } from "@/lib/pro";
import { notifyAsync, fmtText } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { orderNo, reason } = (await req.json()) as {
    orderNo?: string;
    reason?: string;
  };
  if (!orderNo) {
    return NextResponse.json({ error: "orderNo required" }, { status: 400 });
  }

  const sb = getServerSupabase();
  const { data: payment } = await sb
    .from("payments")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "payment not found" }, { status: 404 });
  }
  if (payment.status !== "success") {
    return NextResponse.json(
      { error: `cannot cancel status=${payment.status}` },
      { status: 400 }
    );
  }

  // Call KorPay cancel API
  const res = await fetch(getCancelUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mid: getMid(),
      ordNo: orderNo,
      canAmt: String(payment.amount),
      canNm: admin.email,
      canMsg: reason ?? "관리자 환불",
    }),
  });

  let result: Record<string, unknown> = {};
  try {
    result = await res.json();
  } catch {
    result = { raw: await res.text() };
  }

  if (result.res_code !== "0000") {
    return NextResponse.json(
      { error: result.res_msg ?? "cancel failed", result },
      { status: 502 }
    );
  }

  await sb
    .from("payments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
      raw_response: { ...(payment.raw_response ?? {}), cancel: result },
    })
    .eq("order_no", orderNo);

  await revokePro(payment.user_id);

  notifyAsync(
    `💸 <b>결제 환불</b>\n${payment.amount.toLocaleString()}원\n사유: ${fmtText(
      reason ?? "-",
      100
    )}\n<code>${orderNo}</code>`
  );

  return NextResponse.json({ ok: true, result });
}
