import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { extendPro } from "@/lib/pro";
import { confirmPayment, PLANS } from "@/lib/korpay";
import { notifyAsync, fmtText } from "@/lib/telegram";

export const runtime = "nodejs";

/**
 * 코페이 인증 단계 응답을 받는 endpoint.
 * 인증 성공(resultCode=0000) 시 paymentKey로 결제 승인 API를 추가 호출해야 함.
 */
export async function POST(req: Request) {
  let data: Record<string, string> = {};
  try {
    const formData = await req.formData();
    formData.forEach((v, k) => {
      data[k] = typeof v === "string" ? v : "";
    });
  } catch {
    try {
      data = (await req.json()) as Record<string, string>;
    } catch {
      // ignore
    }
  }

  const orderNumber = data.orderNumber || "";
  const resultCode = data.resultCode || "";
  const message = data.message || "";
  const paymentKey = data.paymentKey || "";

  const origin = getOrigin(req);
  const sb = getServerSupabase();

  if (!orderNumber) {
    return redirect(origin, "fail", "주문번호가 없어요");
  }

  const { data: payment, error: lookupErr } = await sb
    .from("payments")
    .select("*")
    .eq("order_no", orderNumber)
    .maybeSingle();
  if (lookupErr || !payment) {
    return redirect(origin, "fail", "결제 정보를 찾을 수 없어요");
  }

  // 이미 처리된 주문인지 확인 (중복 처리 방지)
  if (payment.status === "success") {
    return redirect(origin, "success", "");
  }

  // 인증 단계 실패
  if (resultCode !== "0000" || !paymentKey) {
    await sb
      .from("payments")
      .update({
        status: resultCode === "E111" ? "cancelled" : "failed",
        result_cd: resultCode,
        result_msg: message,
        raw_response: { auth: data },
      })
      .eq("order_no", orderNumber);

    if (resultCode === "E111") {
      return redirect(origin, "fail", "결제를 취소했어요");
    }
    notifyAsync(
      `❌ <b>결제 인증 실패</b>\n${fmtText(orderNumber)}\n${fmtText(message, 200)} (${resultCode})`
    );
    return redirect(origin, "fail", message || "인증 실패");
  }

  // 인증 성공 → 결제 승인 API 호출
  const confirm = await confirmPayment(paymentKey);

  const confirmData = confirm.data;
  const confirmResultCode = (confirmData.resultCode as string) || "";
  const confirmMessage = (confirmData.message as string) || "";
  const tid = (confirmData.tid as string) || "";
  const confirmAmount = Number(confirmData.amount ?? 0);
  const card = confirmData.card as Record<string, unknown> | undefined;
  const approvalNumber = (card?.approvalNumber as string) || "";

  const isSuccess = confirm.ok && confirmResultCode === "3001";

  if (!isSuccess) {
    await sb
      .from("payments")
      .update({
        status: "failed",
        result_cd: confirmResultCode || resultCode,
        result_msg: confirmMessage || message,
        raw_response: { auth: data, confirm: confirmData },
      })
      .eq("order_no", orderNumber);

    notifyAsync(
      `❌ <b>결제 승인 실패</b>\n${fmtText(orderNumber)}\n${fmtText(
        confirmMessage,
        200
      )} (${confirmResultCode || resultCode})`
    );
    return redirect(origin, "fail", confirmMessage || "결제 승인 실패");
  }

  // 금액 위변조 검증
  if (confirmAmount && confirmAmount !== payment.amount) {
    notifyAsync(
      `🚨 <b>결제 금액 불일치</b>\n${orderNumber}\n예상 ${payment.amount} vs 실제 ${confirmAmount}`
    );
    await sb
      .from("payments")
      .update({
        status: "failed",
        result_cd: confirmResultCode,
        result_msg: "amount mismatch",
        raw_response: { auth: data, confirm: confirmData },
      })
      .eq("order_no", orderNumber);
    return redirect(origin, "fail", "결제 금액 불일치");
  }

  // 성공 처리 + Pro 연장
  await sb
    .from("payments")
    .update({
      status: "success",
      tid,
      app_no: approvalNumber,
      result_cd: confirmResultCode,
      result_msg: confirmMessage,
      raw_response: { auth: data, confirm: confirmData },
      completed_at: new Date().toISOString(),
    })
    .eq("order_no", orderNumber);

  const planInfo = PLANS[payment.plan as keyof typeof PLANS];
  if (planInfo) {
    await extendPro(payment.user_id, planInfo.days, payment.plan);
  }

  notifyAsync(
    `💰 <b>결제 성공</b>\n${payment.amount.toLocaleString()}원 · ${
      planInfo?.label ?? payment.plan
    }\n<code>${orderNumber}</code>`
  );

  // Meta Pixel Purchase 이벤트용 파라미터를 success 페이지로 전달
  return redirectSuccess(origin, {
    order: orderNumber,
    amount: String(payment.amount),
    plan: payment.plan,
  });
}

function redirectSuccess(
  origin: string,
  params: Record<string, string>
): NextResponse {
  const qs = new URLSearchParams(params).toString();
  return NextResponse.redirect(`${origin}/pay/success?${qs}`, 303);
}

function redirect(origin: string, kind: "success" | "fail", msg: string) {
  const path =
    kind === "success"
      ? `/pay/success`
      : `/pay/fail?msg=${encodeURIComponent(msg)}`;
  return NextResponse.redirect(`${origin}${path}`, 303);
}

function getOrigin(req: Request): string {
  const url = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host");
  const proto =
    req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  if (forwardedHost) return `${proto}://${forwardedHost}`;
  return `${url.protocol}//${url.host}`;
}
