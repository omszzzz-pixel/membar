import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

function startOfMonthUtc(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

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

  return NextResponse.json({
    persons: personsRes.count ?? 0,
    memos: memosRes.count ?? 0,
  });
}
