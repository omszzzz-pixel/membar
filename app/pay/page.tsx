"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { apiFetch } from "@/lib/apiFetch";

type FormData = Record<string, string>;

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

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);
  const [initUrl, setInitUrl] = useState<string>("");
  const [formData, setFormData] = useState<FormData | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
        setInitUrl(data.initUrl);
        setFormData(data.formData);
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

  useEffect(() => {
    if (status === "ready" && formRef.current) {
      formRef.current.submit();
    }
  }, [status]);

  return (
    <main className="flex min-h-dvh flex-col bg-ink">
      <header className="flex items-center justify-between border-b border-paper/10 bg-surface px-4 py-3">
        <h1 className="text-[15px] font-bold text-paper">결제</h1>
        <button
          onClick={() => router.back()}
          className="rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-paper/65 hover:bg-paper/8"
        >
          닫기
        </button>
      </header>

      {status === "loading" && (
        <div className="flex flex-1 items-center justify-center text-[13.5px] text-paper/55">
          결제 준비 중…
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="text-[16px] font-bold text-terra">
            결제를 시작할 수 없어요
          </div>
          <div className="text-[13.5px] text-paper/65">{error}</div>
          <button
            onClick={() => router.replace("/me")}
            className="mt-3 rounded-lg bg-paper/8 px-4 py-2 text-[13px] font-semibold text-paper/80"
          >
            돌아가기
          </button>
        </div>
      )}

      {status === "ready" && formData && (
        <>
          <form
            ref={formRef}
            method="POST"
            action={initUrl}
            target="korpay_iframe"
            style={{ display: "none" }}
          >
            {Object.entries(formData).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          </form>

          <iframe
            name="korpay_iframe"
            id="korpay_iframe"
            title="결제"
            className="flex-1 w-full border-0 bg-white"
          />
        </>
      )}
    </main>
  );
}
