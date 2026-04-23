import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import type { TimelineItem } from "@/lib/types";

export const runtime = "nodejs";

type Row = {
  id: string;
  person_id: string;
  raw_input: string;
  created_at: string;
  persons: {
    name: string;
    is_favorite: boolean;
    user_id: string;
  } | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId)
    return NextResponse.json({ error: "userId required" }, { status: 400 });

  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("history")
    .select(
      "id, person_id, raw_input, created_at, persons!inner(name, is_favorite, user_id)"
    )
    .eq("persons.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as Row[];
  const items: TimelineItem[] = rows.map((row) => ({
    id: row.id,
    person_id: row.person_id,
    person_name: row.persons?.name ?? "?",
    person_favorite: row.persons?.is_favorite ?? false,
    raw_input: row.raw_input,
    created_at: row.created_at,
  }));

  return NextResponse.json({ items });
}
