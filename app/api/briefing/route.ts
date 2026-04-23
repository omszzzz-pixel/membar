import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Briefing, HistoryEntry, Person } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `너는 비즈니스 미팅 전 브리핑 생성 엔진이야.
주어진 인물 데이터와 히스토리를 읽고, 만나기 직전 5초 안에 훑어볼 수 있는 간결한 브리핑을 save_briefing 도구로 반환해.

규칙:
- 실제 데이터에 근거한 것만 써. 추측·창작 금지.
- 각 항목은 한국어, 짧고 실용적으로 (한 줄이 이상적).
- recent_context: 요즘 이 사람의 상황을 1-2문장으로. 정보가 부족하면 빈 문자열.
- last_conversations: 지난 히스토리에서 나왔던 핵심 대화 주제 2-4개. 없으면 빈 배열.
- topics_to_mention: 이번에 꺼내면 좋을 얘기 (관심사·공통점·최근 이슈 기반) 1-3개.
- followups: 미완료 todos나 약속, 답변해줄 것 등 "내가 챙길 것". 없으면 빈 배열.
- sensitivities: 주의·배려할 것 (가족 상황, 민감한 주제, 최근 개인사 등). 없으면 빈 배열.
- 각 bullet은 행동 가능한 문장으로. "골프 얘기" 보다는 "최근 스코어 물어보기".
- 반드시 save_briefing 도구를 한 번 호출해.`;

const briefingSchema = {
  type: "object" as const,
  properties: {
    recent_context: {
      type: "string",
      description: "요즘 이 사람의 상황 1-2문장",
    },
    last_conversations: {
      type: "array",
      items: { type: "string" },
      description: "지난번 나눈 핵심 대화 주제",
    },
    topics_to_mention: {
      type: "array",
      items: { type: "string" },
      description: "이번에 꺼낼 얘기",
    },
    followups: {
      type: "array",
      items: { type: "string" },
      description: "챙길 것 (미완료 투두, 약속, 답변 필요한 것)",
    },
    sensitivities: {
      type: "array",
      items: { type: "string" },
      description: "주의·배려할 것",
    },
  },
  required: [
    "recent_context",
    "last_conversations",
    "topics_to_mention",
    "followups",
    "sensitivities",
  ],
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      person?: Person;
      history?: HistoryEntry[];
    };
    if (!body?.person) {
      return NextResponse.json({ error: "person required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not set" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";

    const personSummary = JSON.stringify({
      name: body.person.name,
      title: body.person.title,
      company: body.person.company,
      location: body.person.location,
      education: body.person.education,
      relationship: body.person.relationship,
      birth_year: body.person.birth_year,
      family: body.person.family,
      interests: body.person.interests,
      business: body.person.business,
      tags: body.person.tags,
      todos: body.person.todos,
      i_said: body.person.i_said,
      notes: body.person.notes,
    });

    const historyLines = (body.history ?? [])
      .slice(0, 25)
      .map(
        (h) =>
          `[${new Date(h.created_at).toLocaleDateString("ko-KR")}] ${h.raw_input}`
      )
      .join("\n");

    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `인물 데이터:\n${personSummary}\n\n기록 히스토리:\n${historyLines || "(기록 없음)"}`,
        },
      ],
      tools: [
        {
          name: "save_briefing",
          description: "만남 전 브리핑을 저장",
          input_schema: briefingSchema,
        },
      ],
      tool_choice: { type: "tool", name: "save_briefing" },
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "AI did not return briefing" },
        { status: 502 }
      );
    }

    const briefing = toolUse.input as Briefing;
    return NextResponse.json({ briefing });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate limited" }, { status: 429 });
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
