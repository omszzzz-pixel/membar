import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

// TODO: re-enable admin guard once auth is in place.
// import { getAdminFromRequest } from "@/lib/isAdmin";

type ActivityRow = {
  id: string;
  person_id: string;
  raw_input: string;
  created_at: string;
  persons: {
    name: string;
    user_id: string;
  } | null;
};

type UserAggRow = {
  user_id: string;
  count: number;
};

function startOfDayUtc(daysAgo = 0): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

function startOfMonthUtc(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(_req: Request) {
  // Auth guard temporarily disabled — re-enable once login is set up.
  const sb = getServerSupabase();

  // --- Stats ---
  const [personsAll, memosAll, memosToday, memosWeek, memosMonth] =
    await Promise.all([
      sb.from("persons").select("id", { count: "exact", head: true }),
      sb.from("history").select("id", { count: "exact", head: true }),
      sb
        .from("history")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDayUtc(0)),
      sb
        .from("history")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDayUtc(7)),
      sb
        .from("history")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonthUtc()),
    ]);

  // Distinct user_ids in persons (total users including guests)
  const { data: distinctUsers } = await sb
    .from("persons")
    .select("user_id");
  const uniqueUserIds = new Set(
    (distinctUsers ?? []).map((r) => r.user_id as string)
  );

  // Auth users from Supabase (requires service role)
  const { data: authUsersList } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const authUsers = authUsersList?.users ?? [];

  const newAuthedThisWeek = authUsers.filter((u) => {
    if (!u.created_at) return false;
    return new Date(u.created_at).getTime() >= Date.parse(startOfDayUtc(7));
  }).length;

  // --- Recent activity ---
  const { data: activityRaw } = await sb
    .from("history")
    .select("id, person_id, raw_input, created_at, persons!inner(name, user_id)")
    .order("created_at", { ascending: false })
    .limit(50);

  const activity = (activityRaw as unknown as ActivityRow[] | null)?.map(
    (r) => ({
      id: r.id,
      personId: r.person_id,
      personName: r.persons?.name ?? "?",
      userId: r.persons?.user_id ?? null,
      rawInput:
        r.raw_input.length > 180
          ? r.raw_input.slice(0, 180) + "…"
          : r.raw_input,
      createdAt: r.created_at,
    })
  ) ?? [];

  // --- Users aggregates ---
  // Count persons per user_id
  const personsByUser = new Map<string, number>();
  for (const r of distinctUsers ?? []) {
    const id = r.user_id as string;
    personsByUser.set(id, (personsByUser.get(id) ?? 0) + 1);
  }

  // Count memos per user_id (via persons join)
  const { data: memosByUserRaw } = await sb
    .from("history")
    .select("persons!inner(user_id)");
  const memosByUser = new Map<string, number>();
  const memosRows = (memosByUserRaw as unknown as {
    persons: { user_id: string };
  }[] | null) ?? [];
  for (const r of memosRows) {
    const uid = r.persons?.user_id;
    if (!uid) continue;
    memosByUser.set(uid, (memosByUser.get(uid) ?? 0) + 1);
  }

  // Build user rows — authed users first, then prominent guests
  const userRows = authUsers
    .map((u) => ({
      kind: "authed" as const,
      id: u.id,
      email: u.email ?? null,
      name:
        (u.user_metadata?.name as string | undefined) ??
        (u.user_metadata?.full_name as string | undefined) ??
        (u.user_metadata?.nickname as string | undefined) ??
        null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      personsCount: personsByUser.get(u.id) ?? 0,
      memosCount: memosByUser.get(u.id) ?? 0,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const guestIds = Array.from(uniqueUserIds).filter(
    (id) => !authUsers.some((u) => u.id === id)
  );
  const guestRows = guestIds
    .map((id) => ({
      kind: "guest" as const,
      id,
      email: null,
      name: null,
      createdAt: null,
      lastSignInAt: null,
      personsCount: personsByUser.get(id) ?? 0,
      memosCount: memosByUser.get(id) ?? 0,
    }))
    .sort((a, b) => b.personsCount - a.personsCount)
    .slice(0, 50);

  return NextResponse.json({
    stats: {
      totalUsers: uniqueUserIds.size,
      authedUsers: authUsers.length,
      guestUsers: uniqueUserIds.size - authUsers.length,
      newAuthedThisWeek,
      totalPersons: personsAll.count ?? 0,
      totalMemos: memosAll.count ?? 0,
      memosToday: memosToday.count ?? 0,
      memosThisWeek: memosWeek.count ?? 0,
      memosThisMonth: memosMonth.count ?? 0,
    },
    activity,
    users: [...userRows, ...guestRows],
  });
}
