import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import {
  FREE_LIMIT,
  MONTHLY_MEMO_LIMIT,
  type Meeting,
  type ParsedInput,
  type Person,
  type Todo,
} from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type DbPerson = Omit<Person, "todos" | "meetings"> & {
  todos: Todo[];
  meetings: Meeting[];
};

function mergeMeetings(
  current: Meeting[],
  add?: Meeting[],
  remove?: string[]
): Meeting[] {
  const map = new Map<string, Meeting>();
  for (const m of current ?? []) {
    if (m?.date) map.set(m.date, m);
  }
  for (const m of add ?? []) {
    if (!m?.date) continue;
    const prev = map.get(m.date);
    map.set(m.date, {
      date: m.date,
      place: m.place ?? prev?.place ?? null,
      notes: m.notes ?? prev?.notes ?? null,
    });
  }
  if (remove?.length) {
    for (const dt of remove) map.delete(dt);
  }
  return Array.from(map.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

function uniq(a: string[]): string[] {
  return Array.from(new Set(a.filter(Boolean).map((s) => s.trim()))).filter(
    Boolean
  );
}

function mergeArr(
  current: string[],
  add?: string[],
  remove?: string[]
): string[] {
  const next = uniq([...(current ?? []), ...((add ?? []) as string[])]);
  if (!remove?.length) return next;
  const rm = new Set(remove.map((s) => s.trim()));
  return next.filter((v) => !rm.has(v));
}

function applyParsedToPerson(
  existing: DbPerson | null,
  parsed: ParsedInput,
  rawInput: string
): Partial<DbPerson> {
  const base: DbPerson = existing ?? {
    id: "",
    user_id: "",
    name: parsed.name?.trim() || "알 수 없음",
    title: null,
    company: null,
    location: null,
    education: null,
    relationship: null,
    birth_year: null,
    family: { spouse: false, children: 0 },
    interests: [],
    business: [],
    tags: [],
    todos: [],
    meetings: [],
    i_said: [],
    notes: null,
    is_favorite: false,
    created_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
  };

  const next: DbPerson = {
    ...base,
    name: (parsed.name?.trim() || base.name) as string,
    title: parsed.title !== undefined ? parsed.title : base.title,
    company: parsed.company !== undefined ? parsed.company : base.company,
    location: parsed.location !== undefined ? parsed.location : base.location,
    education:
      parsed.education !== undefined ? parsed.education : base.education,
    relationship:
      parsed.relationship !== undefined
        ? parsed.relationship
        : base.relationship,
    birth_year:
      parsed.birth_year !== undefined && parsed.birth_year !== null
        ? Number(parsed.birth_year) || null
        : base.birth_year,
    family: {
      spouse:
        parsed.family?.spouse !== undefined
          ? !!parsed.family.spouse
          : base.family.spouse,
      children:
        parsed.family?.children !== undefined
          ? Number(parsed.family.children) || 0
          : base.family.children,
      father:
        parsed.family?.father !== undefined
          ? parsed.family.father
          : base.family.father ?? null,
      mother:
        parsed.family?.mother !== undefined
          ? parsed.family.mother
          : base.family.mother ?? null,
      siblings:
        parsed.family?.siblings !== undefined
          ? parsed.family.siblings
          : base.family.siblings ?? null,
      notes:
        parsed.family?.notes !== undefined
          ? parsed.family.notes
          : base.family.notes ?? null,
    },
    interests: mergeArr(
      base.interests,
      parsed.interests,
      parsed.interests_remove
    ),
    business: mergeArr(base.business, parsed.business, parsed.business_remove),
    tags: mergeArr(base.tags, parsed.tags, parsed.tags_remove),
    i_said: uniq([...(base.i_said ?? []), ...((parsed.i_said ?? []) as string[])]),
    notes:
      parsed.notes !== undefined
        ? parsed.notes
        : existing
        ? base.notes
        : rawInput,
    todos: [
      ...(base.todos ?? []),
      ...((parsed.todos ?? []) as string[]).map<Todo>((t) => ({
        text: t,
        done: false,
        created_at: new Date().toISOString(),
      })),
    ],
    meetings: mergeMeetings(
      base.meetings ?? [],
      parsed.meetings,
      parsed.meetings_remove
    ),
    last_updated_at: new Date().toISOString(),
  };

  return next;
}

async function memosThisMonth(
  sb: SupabaseClient,
  userId: string
): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await sb
    .from("history")
    .select("id, persons!inner(user_id)", { count: "exact", head: true })
    .eq("persons.user_id", userId)
    .gte("created_at", start.toISOString());
  return count ?? 0;
}

async function callParse(
  input: string,
  existing: DbPerson | null,
  origin: string
): Promise<ParsedInput> {
  const res = await fetch(`${origin}/api/parse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input, existing }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `parse failed: ${res.status}`);
  }
  const data = (await res.json()) as { parsed: ParsedInput };
  return data.parsed;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId)
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("persons")
    .select("*")
    .eq("user_id", userId)
    .order("last_updated_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ persons: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const { userId, input, forceCreate } = (await req.json()) as {
      userId?: string;
      input?: string;
      forceCreate?: boolean;
    };
    if (!userId || !input)
      return NextResponse.json(
        { error: "userId and input required" },
        { status: 400 }
      );

    const sb = getServerSupabase();

    // Enforce monthly memo limit before we spend tokens parsing
    const memoCount = await memosThisMonth(sb, userId);
    if (memoCount >= MONTHLY_MEMO_LIMIT) {
      return NextResponse.json({ error: "memo_limit" }, { status: 402 });
    }

    const parsed = await callParse(input, null, new URL(req.url).origin);
    const nameCandidate = parsed.name?.trim();

    let existing: DbPerson | null = null;

    if (!forceCreate && nameCandidate) {
      const { data } = await sb
        .from("persons")
        .select("*")
        .eq("user_id", userId)
        .eq("name", nameCandidate);

      const matches = (data ?? []) as DbPerson[];

      if (matches.length > 1) {
        // Ambiguous — let client ask the user which one to attach to
        return NextResponse.json({
          needsDisambiguation: true,
          parsedName: nameCandidate,
          candidates: matches.map((m) => ({
            id: m.id,
            name: m.name,
            title: m.title,
            company: m.company,
            location: m.location,
            relationship: m.relationship,
            tags: m.tags ?? [],
            interests: (m.interests ?? []).slice(0, 3),
            is_favorite: m.is_favorite,
            last_updated_at: m.last_updated_at,
          })),
        });
      }

      existing = matches[0] ?? null;
    }

    if (!existing) {
      const { count } = await sb
        .from("persons")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) >= FREE_LIMIT) {
        return NextResponse.json({ error: "limit" }, { status: 402 });
      }
    }

    const mergedPatch = applyParsedToPerson(existing, parsed, input);

    let saved: DbPerson | null = null;
    if (existing) {
      const { data, error } = await sb
        .from("persons")
        .update(mergedPatch)
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      saved = data as DbPerson;
    } else {
      const insert = {
        user_id: userId,
        name: mergedPatch.name ?? nameCandidate ?? "알 수 없음",
        title: mergedPatch.title ?? null,
        company: mergedPatch.company ?? null,
        location: mergedPatch.location ?? null,
        education: mergedPatch.education ?? null,
        relationship: mergedPatch.relationship ?? null,
        birth_year: mergedPatch.birth_year ?? null,
        family: mergedPatch.family ?? { spouse: false, children: 0 },
        interests: mergedPatch.interests ?? [],
        business: mergedPatch.business ?? [],
        tags: mergedPatch.tags ?? [],
        todos: mergedPatch.todos ?? [],
        meetings: mergedPatch.meetings ?? [],
        i_said: mergedPatch.i_said ?? [],
        notes: mergedPatch.notes ?? input,
      };
      const { data, error } = await sb
        .from("persons")
        .insert(insert)
        .select("*")
        .single();
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      saved = data as DbPerson;
    }

    if (saved) {
      await sb.from("history").insert({
        person_id: saved.id,
        raw_input: input,
        parsed_changes: parsed as unknown as Record<string, unknown>,
      });
    }

    return NextResponse.json({ person: saved, parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, input, id, patch } = (await req.json()) as {
      userId?: string;
      input?: string;
      id?: string;
      patch?: Partial<DbPerson>;
    };
    if (!userId || !id)
      return NextResponse.json(
        { error: "userId and id required" },
        { status: 400 }
      );

    const sb = getServerSupabase();

    // Direct patch (toggles: is_favorite, todos)
    if (patch && !input) {
      const allowed: Partial<DbPerson> = {
        ...(patch.is_favorite !== undefined
          ? { is_favorite: patch.is_favorite }
          : {}),
        ...(patch.todos !== undefined ? { todos: patch.todos } : {}),
        ...(patch.meetings !== undefined
          ? { meetings: patch.meetings }
          : {}),
        last_updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb
        .from("persons")
        .update(allowed)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ person: data });
    }

    if (!input)
      return NextResponse.json({ error: "input required" }, { status: 400 });

    // Enforce monthly memo limit (PATCH with input writes to history)
    const memoCount = await memosThisMonth(sb, userId);
    if (memoCount >= MONTHLY_MEMO_LIMIT) {
      return NextResponse.json({ error: "memo_limit" }, { status: 402 });
    }

    const { data: existing, error: exErr } = await sb
      .from("persons")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (exErr || !existing)
      return NextResponse.json({ error: "not found" }, { status: 404 });

    const parsed = await callParse(
      input,
      existing as DbPerson,
      new URL(req.url).origin
    );
    const mergedPatch = applyParsedToPerson(
      existing as DbPerson,
      parsed,
      input
    );

    const { data: saved, error } = await sb
      .from("persons")
      .update(mergedPatch)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    await sb.from("history").insert({
      person_id: id,
      raw_input: input,
      parsed_changes: parsed as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ person: saved, parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const id = url.searchParams.get("id");
  if (!userId || !id)
    return NextResponse.json(
      { error: "userId and id required" },
      { status: 400 }
    );
  const sb = getServerSupabase();
  const { error } = await sb
    .from("persons")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
