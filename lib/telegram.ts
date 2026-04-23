// Fire-and-forget Telegram notifications to the app owner.
// Requires env vars TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID on the server.
// No-op (logs a warning once) if env vars are missing.

let warned = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    if (!warned) {
      warned = true;
      console.warn(
        "[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — notifications disabled"
      );
    }
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[telegram] send failed", res.status, body);
    }
  } catch (err) {
    console.warn("[telegram] send error", err);
  }
}

// Don't let a slow/failing Telegram call delay the API response.
// Callers await nothing; errors are swallowed inside sendTelegram.
export function notifyAsync(message: string): void {
  void sendTelegram(message);
}

export function fmtUser(u: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
}): string {
  const name = u.name ? escapeHtml(u.name) : "";
  const email = u.email ? escapeHtml(u.email) : "";
  const short = u.id ? u.id.slice(0, 8) : "";
  if (name && email) return `<b>${name}</b> (${email})`;
  if (email) return `<b>${email}</b>`;
  if (name) return `<b>${name}</b>`;
  return `user <code>${short}</code>`;
}

export function fmtText(s: string, max = 300): string {
  const trimmed = s.trim();
  const cut = trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
  return escapeHtml(cut);
}
