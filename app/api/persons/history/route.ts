import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/authGuard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const personId = url.searchParams.get("personId");
  const bodyUserId = url.searchParams.get("userId");
  if (!personId)
    return NextResponse.json({ error: "personId required" }, { status: 400 });

  const resolved = await resolveUserId(req, bodyUserId);
  if ("error" in resolved)
    return NextResponse.json({ error: resolved.error }, { status: 401 });
  const userId = resolved.userId;

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

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const bodyUserId = url.searchParams.get("userId");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const resolved = await resolveUserId(req, bodyUserId);
  if ("error" in resolved)
    return NextResponse.json({ error: resolved.error }, { status: 401 });
  const userId = resolved.userId;

  const sb = getServerSupabase();

  // Verify ownership via join: history.person_id -> persons.user_id
  const { data: row, error: lookupErr } = await sb
    .from("history")
    .select("id, persons!inner(user_id)")
    .eq("id", id)
    .eq("persons.user_id", userId)
    .maybeSingle();

  if (lookupErr)
    return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!row)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { error } = await sb.from("history").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
