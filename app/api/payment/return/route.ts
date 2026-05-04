import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { extendPro } from "@/lib/pro";
import { PLANS, verifyReturnHash } from "@/lib/korpay";
import { notifyAsync, fmtText } from "@/lib/telegram";

export const runtime = "nodejs";

/**
 * 코페이가 결제 결과를 form-encoded POST로 보내는 endpoint.
 * 응답 코드 3001 = 카드 결제 성공, 3002 = 실패.
 */
export async function POST(req: Request) {
  let data: Record<string, string> = {};
  try {
    const formData = await req.formData();
    formData.forEach((v, k) => {
      data[k] = typeof v === "string" ? v : "";
    });
  } catch {
    // Some PG variants use JSON; try fallback
    try {
      data = (await req.json()) as Record<string, string>;
    } catch {
      // ignore
    }
  }

  const orderNo = data.ordNo || data.orderNo || "";
  const resultCd = data.resultCd || "";
  const resultMsg = data.resultMsg || "";
  const tid = data.tid || "";
  const appNo = data.appNo || "";
  const amount = parseInt(data.amt || "0", 10);
  const hash = data.hash || "";

  const origin = getOrigin(req);
  const sb = getServerSupabase();

  if (!orderNo) {
    return redirect(origin, "fail", "주문번호가 없어요");
  }

  // Look up pre-recorded payment
  const { data: payment, error: lookupErr } = await sb
    .from("payments")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();
  if (lookupErr || !payment) {
    return redirect(origin, "fail", "결제 정보를 찾을 수 없어요");
  }

  // Save raw response regardless of outcome
  const updateBase = {
    result_cd: resultCd,
    result_msg: resultMsg,
    tid,
    app_no: appNo,
    raw_response: data,
  };

  if (resultCd === "3001") {
    // Verify hash to prevent tampering
    if (hash) {
      const ok = verifyReturnHash(orderNo, payment.amount, appNo, hash);
      if (!ok) {
        await sb
          .from("payments")
          .update({ ...updateBase, status: "failed" })
          .eq("order_no", orderNo);
        notifyAsync(
          `🚨 <b>결제 hash 검증 실패</b>\nOrder: ${fmtText(orderNo)}\n위변조 의심`
        );
        return redirect(origin, "fail", "결제 검증 실패. 고객센터 문의 부탁드려요");
      }
    }

    // Amount mismatch check
    if (amount && amount !== payment.amount) {
      notifyAsync(
        `🚨 <b>결제 금액 불일치</b>\nOrder: ${orderNo}\n예상 ${payment.amount} vs 실제 ${amount}`
      );
      // Still mark failed
      await sb
        .from("payments")
        .update({ ...updateBase, status: "failed" })
        .eq("order_no", orderNo);
      return redirect(origin, "fail", "결제 금액 불일치");
    }

    // Mark success + extend Pro
    await sb
      .from("payments")
      .update({
        ...updateBase,
        status: "success",
        completed_at: new Date().toISOString(),
      })
      .eq("order_no", orderNo);

    const planInfo = PLANS[payment.plan as keyof typeof PLANS];
    if (planInfo) {
      await extendPro(payment.user_id, planInfo.days, payment.plan);
    }

    notifyAsync(
      `💰 <b>결제 성공</b>\n${payment.amount.toLocaleString()}원 · ${
        planInfo?.label ?? payment.plan
      }\n<code>${orderNo}</code>`
    );

    return redirect(origin, "success", "");
  }

  // Failed
  await sb
    .from("payments")
    .update({ ...updateBase, status: "failed" })
    .eq("order_no", orderNo);

  notifyAsync(
    `❌ <b>결제 실패</b>\n${fmtText(orderNo)}\n${fmtText(resultMsg, 200)}`
  );

  return redirect(origin, "fail", resultMsg || "결제 실패");
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
