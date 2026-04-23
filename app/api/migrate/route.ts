import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ error: "env not set" }, { status: 500 });
    }

    const userClient = createClient(url, anon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const authUserId = userData.user.id;
    const body = (await req.json()) as { oldUserId?: string };
    const oldUserId = body.oldUserId;

    if (!oldUserId || oldUserId === authUserId) {
      return NextResponse.json({ ok: true, migrated: 0 });
    }

    const admin = getServerSupabase();

    // Avoid clobbering: if authed user already has persons, skip migration.
    const { count: authedCount } = await admin
      .from("persons")
      .select("id", { count: "exact", head: true })
      .eq("user_id", authUserId);

    if ((authedCount ?? 0) > 0) {
      return NextResponse.json({ ok: true, migrated: 0, reason: "already has data" });
    }

    const { data, error } = await admin
      .from("persons")
      .update({ user_id: authUserId })
      .eq("user_id", oldUserId)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, migrated: data?.length ?? 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
