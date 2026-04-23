import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseMemo } from "@/lib/parseMemo";
import type { Person } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      input: string;
      existing?: Person | null;
    };
    if (!body?.input || typeof body.input !== "string") {
      return NextResponse.json({ error: "input required" }, { status: 400 });
    }

    const parsed = await parseMemo(body.input, body.existing ?? null);
    return NextResponse.json({ parsed });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "rate limited, try again shortly" },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status ?? 500 }
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
