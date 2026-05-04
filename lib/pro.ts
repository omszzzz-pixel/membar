import { getServerSupabase } from "./supabase";

/** 현재 시각 기준으로 Pro 활성 상태인지 검사. */
export async function isPro(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const sb = getServerSupabase();
  const { data } = await sb
    .from("profiles")
    .select("pro_until")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.pro_until) return false;
  return new Date(data.pro_until) > new Date();
}

/** 현재 만료일 + days 만큼 연장. 이미 지난 경우 today + days. */
export async function extendPro(
  userId: string,
  days: number,
  plan: string
): Promise<string> {
  const sb = getServerSupabase();
  const { data: existing } = await sb
    .from("profiles")
    .select("pro_until")
    .eq("user_id", userId)
    .maybeSingle();

  const now = Date.now();
  const base =
    existing?.pro_until && Date.parse(existing.pro_until) > now
      ? Date.parse(existing.pro_until)
      : now;
  const newUntil = new Date(base + days * 86_400_000).toISOString();

  await sb
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        pro_until: newUntil,
        plan,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return newUntil;
}

/** 환불 시 Pro 기간 회수 (단순화: 그냥 만료시킴). */
export async function revokePro(userId: string): Promise<void> {
  const sb = getServerSupabase();
  await sb
    .from("profiles")
    .update({
      pro_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}
