import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAdminFromRequest } from "@/lib/isAdmin";
import { getBaseUrl, getMerchantId } from "@/lib/korpay";
import { revokePro } from "@/lib/pro";
import { notifyAsync, fmtText } from "@/lib/telegram";

export const runtime = "nodejs";

/**
 * 관리자 환불 처리.
 * TODO: 코페이 cancel API endpoint 정확한 URL을 받아서 연결.
 *       현 시점에서는 placeholder — 실제 호출 전 코페이에 확인 필요.
 *       추정 URL: {BASE_URL}/payments/cancel?paymentKey=xxx (또는 별도)
 */
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
  if (!payment.tid) {
    return NextResponse.json({ error: "tid missing" }, { status: 400 });
  }

  // TODO: 코페이 정식 cancel endpoint URL 확정 필요
  const cancelUrl = `${getBaseUrl()}/payments/cancel`;
  const res = await fetch(cancelUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantId: getMerchantId(),
      orderNumber: orderNo,
      tid: payment.tid,
      cancelAmount: payment.amount,
      cancelReason: reason ?? "관리자 환불",
    }),
  });

  let result: Record<string, unknown> = {};
  try {
    result = await res.json();
  } catch {
    result = { raw: await res.text() };
  }

  // resultCode 2001 = 취소 성공
  if (result.resultCode !== "2001") {
    return NextResponse.json(
      { error: result.message ?? "cancel failed", result },
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
