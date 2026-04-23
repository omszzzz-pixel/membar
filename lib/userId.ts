// Simple per-browser user id so we can ship MVP without a login screen.
// Replace with Supabase Auth later.
const KEY = "membar_user_id";
const LEGACY_KEY = "inmaek_user_id";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    // migrate from legacy key so existing data keeps showing
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    id = legacy ?? crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
