import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const personId = url.searchParams.get("personId");
  const userId = url.searchParams.get("userId");
  if (!personId || !userId)
    return NextResponse.json(
      { error: "personId and userId required" },
      { status: 400 }
    );

  const sb = getServerSupabase();
  const { data: person, error: pErr } = await sb
    .from("persons")
    .select("id")
    .eq("id", personId)
    .eq("user_id", userId)
    .maybeSingle();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!person) return NextResponse.json({ history: [] });

  const { data, error } = await sb
    .from("history")
    .select("*")
    .eq("person_id", personId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ history: data ?? [] });
}
