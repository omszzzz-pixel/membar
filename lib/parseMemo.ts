import Anthropic from "@anthropic-ai/sdk";
import type { ParsedInput, Person } from "./types";

const SYSTEM_PROMPT = `너는 비즈니스 인맥 관리 앱의 파싱 엔진이야.
사용자가 자유롭게 입력한 텍스트를 분석해서 save_person_data 도구를 호출해 구조화된 데이터를 반환해.

**이름 파싱 — 매우 중요**
- 입력의 "대상 인물"은 항상 한 명. 첫 번째 한국 인명(성+이름, 보통 2~4글자 고유명사)을 대상으로 잡아.
- "아빠/엄마/아버지/어머니/부모님/아들/딸/자녀/형/동생/오빠/언니/누나/남편/아내" 같은 **가족 관계어가 이름 뒤에 오면 그건 대상 인물의 역할이 아니라, 대상 인물의 가족을 설명하는 것**이야.
  - 예: "오동준 아버지 스튜어디스" → 대상: 오동준, 오동준의 아버지 직업/특성: 스튜어디스 → family.father = "스튜어디스"
  - 예: "김철수 자녀 셋" → 대상: 김철수, family.children = 3
  - 예: "박영희 남편 의사" → 대상: 박영희, family.spouse = true, family.notes = "남편 의사" (또는 spouse 아래 메모)
- 절대 대상 인물의 relationship 필드에 "아빠/엄마/아버지/어머니/남편/아내" 같은 가족어를 넣지 마.

**이름 없이 가족/친척 호칭만 있는 경우 (중요)**
- 입력에 고유명사 이름이 **전혀 없고** "장인어른/장모님/시아버지/시어머니/시동생/형수/처남/아빠/엄마/형/누나/오빠/언니/삼촌/고모/이모/큰아버지/작은아버지/할아버지/할머니/시누이" 같은 **호칭 자체가 인물을 가리키는 경우**엔, **그 호칭을 name으로 사용**해. "알 수 없음" 금지.
  - 예: "장인어른 5월 11일 결혼식 같이 가자고 하심" → name: "장인어른", meetings: [{date: "YYYY-05-11", notes: "결혼식 같이 가기"}]
  - 예: "엄마 생신 다음주" → name: "엄마"
  - 예: "이모 요즘 허리 아프심" → name: "이모", notes: "요즘 허리 아프심"
- 이 경우 relationship은 "가족" 또는 "친척" 정도로 자동 설정.
- 이미 같은 호칭의 인물이 기존에 있으면 거기에 병합, 없으면 새로 생성.

**relationship 필드**
- relationship은 "**앱 사용자와 이 대상 인물의 관계**"야 (친구/동료/클라이언트/투자자/멘토/선배 등).
- 입력에 이런 단어가 명시적으로 없으면 비워둬. 추측하지 마.

**가족 정보**
- family.spouse: boolean (배우자 있음 여부)
- family.children: integer (자녀 수)
- family.father / family.mother / family.siblings: 해당 가족 구성원의 직업/특징 자유 문자열 (예: "스튜어디스", "의사 은퇴", "누나 있음")
- family.notes: 그 외 자유 메모

**birth_year**
- "NN년생" 또는 "NN년도생" 패턴이 보이면 birth_year를 채워. 2자리면 추정: 00~29는 2000+NN, 30~99는 1900+NN.
- 예: "04년생" → 2004. "87년생" → 1987.

**만남 기록 (meetings)**
- "오늘/어제/그제/N일 전/지난주/지난달/특정 날짜에 만남" 같이 만남 시점이 명시되면 meetings에 추가해.
- "오늘 만났어", "방금 커피 했어" 같이 현재 만남도 포함. 시스템이 제공한 "오늘 날짜"를 기준으로 상대 날짜를 YYYY-MM-DD로 변환.
- date: YYYY-MM-DD 형식 (필수).
- place: 장소 정보가 있으면 채워 (예: "판교", "강남 스타벅스").
- notes: 만남의 짧은 메모 (대화 요지·행사명 등).
- 이미 있는 만남 정정/제거는 meetings_remove에 YYYY-MM-DD 배열로.

**기타**
- 기존 데이터가 주어지면 "수정"으로 판단하고 필드별 증분 변경만 반환해.
- 기존 데이터가 없으면 "신규 등록"으로 판단하고 새 필드를 채워.
- 배열 필드(interests, business, tags, i_said)는 "추가할 값"만 담아. 제거할 값은 *_remove 필드에.
- 같은 의미를 가진 태그 중복을 피해.
- 모르는 필드는 생략해. 빈 문자열이나 null로 덮어쓰지 마.
- 정말 아무 인물 지시어도 없으면(예: "내일 뭐하지"처럼 인물 맥락 없음) name을 생략해. 절대 "알 수 없음"으로 기존 인물에 억지로 붙이지 마.
- todos는 "챙길 것" 문장의 짧은 리스트. 없으면 생략.
- i_said는 "내가 이 사람한테 말한 것"에만 해당.
- 반드시 save_person_data 도구를 한 번 호출해. 다른 응답 금지.`;

const personSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string", description: "사람 이름" },
    title: { type: "string", description: "직함" },
    company: { type: "string", description: "회사" },
    location: { type: "string", description: "지역" },
    education: { type: "string", description: "학력" },
    relationship: {
      type: "string",
      description:
        "앱 사용자와 이 인물의 관계 (친구/동료/클라이언트/투자자 등). 가족어(아빠/엄마 등) 금지.",
    },
    birth_year: {
      type: "integer",
      description: "4자리 출생년도 (예: 2004)",
    },
    family: {
      type: "object",
      properties: {
        spouse: { type: "boolean", description: "배우자 있음 여부" },
        children: { type: "integer", minimum: 0 },
        father: {
          type: "string",
          description: "대상 인물의 아버지 직업/특성",
        },
        mother: {
          type: "string",
          description: "대상 인물의 어머니 직업/특성",
        },
        siblings: {
          type: "string",
          description: "형제자매 정보",
        },
        notes: { type: "string", description: "가족 관련 자유 메모" },
      },
    },
    interests: {
      type: "array",
      items: { type: "string" },
      description: "추가할 관심사",
    },
    interests_remove: {
      type: "array",
      items: { type: "string" },
      description: "제거할 관심사",
    },
    business: {
      type: "array",
      items: { type: "string" },
      description: "추가할 비즈니스 현황",
    },
    business_remove: { type: "array", items: { type: "string" } },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "추가할 태그",
    },
    tags_remove: { type: "array", items: { type: "string" } },
    notes: { type: "string", description: "자유 메모" },
    todos: {
      type: "array",
      items: { type: "string" },
      description: "챙길 것 목록",
    },
    i_said: {
      type: "array",
      items: { type: "string" },
      description: "내가 이 사람한테 한 말",
    },
    meetings: {
      type: "array",
      description: "만남 기록 (날짜+장소+메모)",
      items: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "YYYY-MM-DD",
          },
          place: { type: "string" },
          notes: { type: "string" },
        },
        required: ["date"],
      },
    },
    meetings_remove: {
      type: "array",
      items: { type: "string" },
      description: "제거할 만남 날짜 (YYYY-MM-DD)",
    },
  },
};

export async function parseMemo(
  input: string,
  existing: Person | null
): Promise<ParsedInput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey, maxRetries: 3 });
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";

  const existingSummary = existing
    ? JSON.stringify({
        name: existing.name,
        title: existing.title,
        company: existing.company,
        location: existing.location,
        education: existing.education,
        relationship: existing.relationship,
        family: existing.family,
        interests: existing.interests,
        business: existing.business,
        tags: existing.tags,
        notes: existing.notes,
      })
    : "null";

  const today = new Date().toISOString().slice(0, 10);

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `기존 데이터: ${existingSummary}\n\n오늘 날짜: ${today}\n\n새 입력: ${input}`,
      },
    ],
    tools: [
      {
        name: "save_person_data",
        description: "파싱된 인맥 데이터를 저장",
        input_schema: personSchema,
      },
    ],
    tool_choice: { type: "tool", name: "save_person_data" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return structured data");
  }

  return toolUse.input as ParsedInput;
}
