import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/authGuard";
import {
  calcHashKey,
  ediDate,
  generateOrderNumber,
  getBaseUrl,
  getMerchantId,
  PLANS,
  type PlanId,
} from "@/lib/korpay";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { plan } = (await req.json()) as { plan?: string };
    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }
    const planInfo = PLANS[plan as PlanId];

    const resolved = await resolveUserId(req, null);
    if ("error" in resolved || !resolved.authed) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    const userId = resolved.userId;

    const sb = getServerSupabase();

    const { data: userResult } = await sb.auth.admin.getUserById(userId);
    const meta = (userResult?.user?.user_metadata ?? {}) as Record<
      string,
      unknown
    >;
    const buyerName =
      (meta.name as string | undefined) ??
      (meta.full_name as string | undefined) ??
      (meta.nickname as string | undefined) ??
      userResult?.user?.email?.split("@")[0] ??
      "membar 사용자";
    const buyerEmail = userResult?.user?.email ?? "";

    const orderNumber = generateOrderNumber();
    const ed = ediDate();
    const amount = planInfo.amount;
    const hashKey = calcHashKey(ed, amount);

    const { error: insertErr } = await sb.from("payments").insert({
      user_id: userId,
      order_no: orderNumber,
      mid: getMerchantId(),
      amount,
      plan,
      status: "init",
    });
    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }

    const origin = getOrigin(req);
    const returnUrl = `${origin}/api/payment/return`;

    return NextResponse.json({
      baseUrl: getBaseUrl(),
      paymentData: {
        merchantId: getMerchantId(),
        productName: `membar Pro ${planInfo.label}`,
        orderNumber,
        amount,
        payMethod: "card",
        returnUrl,
        ediDate: ed,
        hashKey,
        customerName: buyerName,
        customerEmail: buyerEmail,
        reserved: userId,
        language: "ko",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function getOrigin(req: Request): string {
  const url = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host");
  const proto =
    req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  if (forwardedHost) return `${proto}://${forwardedHost}`;
  return `${url.protocol}//${url.host}`;
}
