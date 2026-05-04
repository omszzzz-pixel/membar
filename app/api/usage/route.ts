import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/authGuard";

export const runtime = "nodejs";

async function getProUntil(
  sb: ReturnType<typeof getServerSupabase>,
  userId: string
): Promise<string | null> {
  const { data } = await sb
    .from("profiles")
    .select("pro_until")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.pro_until ?? null;
}

function startOfMonthUtc(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bodyUserId = url.searchParams.get("userId");

  const resolved = await resolveUserId(req, bodyUserId);
  if ("error" in resolved)
    return NextResponse.json({ error: resolved.error }, { status: 401 });
  const userId = resolved.userId;

  const sb = getServerSupabase();

  const [personsRes, memosRes] = await Promise.all([
    sb
      .from("persons")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    sb
      .from("history")
      .select("id, persons!inner(user_id)", { count: "exact", head: true })
      .eq("persons.user_id", userId)
      .gte("created_at", startOfMonthUtc()),
  ]);

  if (personsRes.error) {
    return NextResponse.json(
      { error: personsRes.error.message },
      { status: 500 }
    );
  }
  if (memosRes.error) {
    return NextResponse.json(
      { error: memosRes.error.message },
      { status: 500 }
    );
  }

  const proUntil = resolved.authed ? await getProUntil(sb, userId) : null;
  const isPro =
    proUntil !== null && new Date(proUntil) > new Date();

  return NextResponse.json({
    persons: personsRes.count ?? 0,
    memos: memosRes.count ?? 0,
    pro: isPro,
    proUntil,
  });
}
