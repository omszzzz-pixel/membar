"use client";

import { useState } from "react";
import { useUser } from "@/lib/userContext";

export default function FeedbackBox() {
  const { userId, email, name, authed } = useUser();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = text.trim().length > 0 && !sending;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: authed ? userId : null,
          email,
          name,
          message: text.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "전송 실패");
      }
      setSent(true);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "전송 실패");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/8 px-4 py-3.5">
        <div className="text-[13.5px] font-semibold text-gold">
          피드백 고마워요 ·✓
        </div>
        <div className="mt-1 text-[12.5px] text-paper/65">
          잘 읽어볼게요. 계속 더 좋게 만들어 나갈게요.
        </div>
        <button
          onClick={() => setSent(false)}
          className="mt-2 text-[12px] font-semibold text-gold hover:underline"
        >
          또 보내기
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-paper/10 bg-surface px-4 py-3.5">
      <div className="text-[13.5px] font-semibold text-paper">
        개발자에게 바란다
      </div>
      <div className="mt-0.5 text-[12px] text-paper/55">
        불편한 점·원하는 기능·버그 · 뭐든 편하게 써주세요
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="예: 로그인할 때 OO이 불편해요 / OO 기능 있었으면"
        rows={3}
        maxLength={2000}
        className="mt-2.5 w-full resize-none rounded-lg border border-paper/10 bg-ink/40 p-3 text-[14px] leading-relaxed text-paper outline-none transition placeholder:text-paper/40 focus:border-gold"
      />
      {error && (
        <div className="mt-2 text-[12px] font-medium text-terra">{error}</div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[11.5px] text-paper/45">
          {authed ? email ?? "로그인됨" : "게스트로 전송"}
        </div>
        <button
          onClick={submit}
          disabled={!canSend}
          className="rounded-lg bg-gold px-4 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-gold-soft"
        >
          {sending ? "보내는 중…" : "보내기"}
        </button>
      </div>
    </div>
  );
}
