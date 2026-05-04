"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { apiFetch } from "@/lib/apiFetch";

type PaymentData = {
  merchantId: string;
  productName: string;
  orderNumber: string;
  amount: number;
  payMethod: string;
  returnUrl: string;
  ediDate: string;
  hashKey: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPost?: string;
  reserved?: string;
  language?: string;
};

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-[13.5px] text-paper/55">
          결제 준비 중…
        </main>
      }
    >
      <PayInner />
    </Suspense>
  );
}

function PayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan");
  const { authed, loading: userLoading } = useUser();

  const [status, setStatus] = useState<"loading" | "ready" | "running" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    if (userLoading) return;
    if (!authed) {
      router.replace("/me");
      return;
    }
    if (!plan || !["1m", "6m", "12m"].includes(plan)) {
      setError("플랜이 지정되지 않았어요.");
      setStatus("error");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/payment/init", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "결제 준비 실패");
          setStatus("error");
          return;
        }
        setBaseUrl(data.baseUrl);
        setPaymentData(data.paymentData);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "결제 준비 실패");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userLoading, authed, plan, router]);

  // 데이터 받으면 자동으로 SDK 결제창 호출
  useEffect(() => {
    if (status !== "ready" || !paymentData || !baseUrl) return;

    let mounted = true;
    (async () => {
      try {
        const mod = await import("@korpay/sdk");
        const KorpaySdk = mod.default;
        if (!mounted) return;
        setStatus("running");
        // SDK type is more strict about payMethod literal — cast through unknown
        const sdkData = paymentData as unknown as Parameters<
          typeof KorpaySdk.payment
        >[1];
        KorpaySdk.payment(baseUrl, sdkData, {
          onStart: () => {
            // do nothing
          },
          onError: (err: string) => {
            setError(err || "결제창 호출 오류");
            setStatus("error");
          },
          onClose: () => {
            // 결제창 닫혔을 때 — 인증 성공 여부는 returnUrl에서 처리됨
            // 이 시점에 status를 ready로 되돌리지 않고 그대로 두면
            // 사용자가 닫기를 눌러야 빠져나올 수 있음
          },
        });
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "결제 SDK 로드 실패"
        );
        setStatus("error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [status, paymentData, baseUrl]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6">
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-paper/10 bg-surface px-4 py-3">
        <h1 className="text-[15px] font-bold text-paper">결제</h1>
        <button
          onClick={() => router.back()}
          className="rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-paper/65 hover:bg-paper/8"
        >
          닫기
        </button>
      </header>

      {(status === "loading" || status === "running") && (
        <div className="text-center">
          <div className="text-[15px] font-semibold text-paper">
            {status === "loading" ? "결제 준비 중…" : "결제창 여는 중…"}
          </div>
          <div className="mt-1 text-[12.5px] text-paper/55">
            잠시만 기다려주세요
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="text-center text-[14px] text-paper/65">
          결제창 호출 중…
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-[16px] font-bold text-terra">
            결제를 시작할 수 없어요
          </div>
          <div className="max-w-[320px] text-[13.5px] text-paper/65">
            {error}
          </div>
          <button
            onClick={() => router.replace("/me")}
            className="mt-3 rounded-lg bg-paper/8 px-4 py-2 text-[13px] font-semibold text-paper/80"
          >
            돌아가기
          </button>
        </div>
      )}
    </main>
  );
}
