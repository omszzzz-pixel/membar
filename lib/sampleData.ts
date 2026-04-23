import type { HistoryEntry, Person } from "./types";

export const SAMPLE_PREFIX = "__sample__";

export function isSample(id: string): boolean {
  return id.startsWith(SAMPLE_PREFIX);
}

const now = Date.now();
const d = (days: number) => new Date(now - days * 86_400_000).toISOString();

export const SAMPLE_PERSONS: Person[] = [
  {
    id: `${SAMPLE_PREFIX}_1`,
    user_id: "sample",
    name: "홍지호",
    title: "프로덕트 리드",
    company: "네이버",
    location: "판교",
    education: "서울대 컴퓨터공학",
    relationship: "멘토",
    birth_year: 1985,
    family: {
      spouse: true,
      children: 2,
      father: "의사 은퇴",
      mother: "한국무용 강사",
      siblings: "누나 둘",
      notes: null,
    },
    interests: ["골프", "위스키", "클래식 음악", "등산"],
    business: ["AI 프로덕트 B2B 확장 검토", "시리즈 B 투자 유치 중"],
    tags: ["유니콘 경험", "연대 총동창", "서울대 CS"],
    todos: [
      { text: "다음 주 판교에서 점심 약속", done: false, created_at: d(1) },
      { text: "AI 컨퍼런스 티켓 전달", done: true, created_at: d(7) },
      { text: "디자이너 포지션 추천 드리기", done: false, created_at: d(3) },
    ],
    meetings: [
      { date: d(-3).slice(0, 10), place: "판교 브런치", notes: "다음 주 점심 약속" },
      { date: d(2).slice(0, 10), place: "판교 몽상", notes: "점심 1시간" },
      { date: d(18).slice(0, 10), place: "판교", notes: "AI 컨퍼런스 후 커피" },
      { date: d(40).slice(0, 10), place: "전화", notes: "30분 멘토링 콜" },
      { date: d(55).slice(0, 10), place: "강남 그랜드", notes: "저녁 식사" },
    ],
    i_said: [
      "초기 스타트업 프로덕트 리서치에 얼마나 투자해야 할지 조언 구함",
      "리크루팅 전략 얘기 나눔",
    ],
    notes:
      "2023년 스타트업 컨퍼런스에서 처음 만남. 매달 한 번 정도 판교에서 점심. 아내분이 피아니스트라 클래식 얘기 많이 함.",
    is_favorite: true,
    created_at: d(120),
    last_updated_at: d(1),
  },
  {
    id: `${SAMPLE_PREFIX}_2`,
    user_id: "sample",
    name: "박서연",
    title: "심사역",
    company: "카카오벤처스",
    location: "강남",
    education: "KAIST 경영공학",
    relationship: "투자자",
    birth_year: 1990,
    family: {
      spouse: false,
      children: 0,
      father: null,
      mother: null,
      siblings: "오빠",
      notes: null,
    },
    interests: ["서핑", "재즈", "테니스"],
    business: ["AI 시드/A 활발 투자", "헬스케어 버티컬 관심"],
    tags: ["VC", "KAIST 창업연대"],
    todos: [{ text: "피치덱 피드백 받기", done: false, created_at: d(2) }],
    meetings: [
      { date: d(-6).slice(0, 10), place: "테헤란로", notes: "피치덱 피드백" },
      { date: d(6).slice(0, 10), place: "강남 오피스", notes: "피치 미팅" },
      { date: d(28).slice(0, 10), place: "LA 샌타모니카", notes: "서핑 후 저녁" },
    ],
    i_said: ["팀 출장 때 LA에서 서핑 얘기 같이 함"],
    notes: "LA 출장에서 처음 인사. 서핑·재즈 취향 비슷해서 금방 친해짐.",
    is_favorite: false,
    created_at: d(30),
    last_updated_at: d(5),
  },
  {
    id: `${SAMPLE_PREFIX}_3`,
    user_id: "sample",
    name: "이준호",
    title: "개발자",
    company: "현대차 R&D",
    location: "남양",
    education: "포스텍 전산",
    relationship: "대학 동기",
    birth_year: 1988,
    family: {
      spouse: true,
      children: 1,
      father: null,
      mother: null,
      siblings: null,
      notes: null,
    },
    interests: ["러닝", "보드게임"],
    business: ["자율주행 소프트웨어 팀"],
    tags: ["포스텍", "대학동기"],
    todos: [
      { text: "생일 챙기기 (다음 달)", done: false, created_at: d(10) },
      { text: "추천해준 책 읽고 후기 전달", done: false, created_at: d(20) },
    ],
    meetings: [
      { date: d(42).slice(0, 10), place: "강남", notes: "오랜만 저녁" },
    ],
    i_said: [],
    notes: "대학 때 같은 연구실. 요즘 연락이 뜸하지만 한 번 연락하면 3시간 얘기함.",
    is_favorite: false,
    created_at: d(200),
    last_updated_at: d(35),
  },
];

export const SAMPLE_HISTORY: Record<string, HistoryEntry[]> = {
  [`${SAMPLE_PREFIX}_1`]: [
    {
      id: `${SAMPLE_PREFIX}_h1`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "홍지호 네이버 프로덕트 리드 서울대 CS 85년생 멘토 판교",
      parsed_changes: {},
      created_at: d(120),
    },
    {
      id: `${SAMPLE_PREFIX}_h2`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "골프 위스키 클래식 좋아함 부인 있고 자녀 둘 아버지 의사 은퇴 어머니 한국무용 강사",
      parsed_changes: {},
      created_at: d(60),
    },
    {
      id: `${SAMPLE_PREFIX}_h3`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input: "시리즈 B 투자 유치 중 AI B2B 확장 검토 요즘 바쁜 듯",
      parsed_changes: {},
      created_at: d(14),
    },
    {
      id: `${SAMPLE_PREFIX}_h4`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input: "다음 주 판교에서 점심 약속 잡기",
      parsed_changes: {},
      created_at: d(1),
    },
  ],
  [`${SAMPLE_PREFIX}_2`]: [
    {
      id: `${SAMPLE_PREFIX}_h5`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "박서연 카카오벤처스 심사역 KAIST 경영 서핑 재즈 테니스 90년생",
      parsed_changes: {},
      created_at: d(30),
    },
    {
      id: `${SAMPLE_PREFIX}_h6`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input: "AI 시드/A 활발 투자 요즘 헬스케어 버티컬 관심",
      parsed_changes: {},
      created_at: d(5),
    },
  ],
  [`${SAMPLE_PREFIX}_3`]: [
    {
      id: `${SAMPLE_PREFIX}_h7`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "이준호 포스텍 전산 현대차 R&D 자율주행 개발자 대학동기 88년생 결혼 자녀 한명",
      parsed_changes: {},
      created_at: d(200),
    },
    {
      id: `${SAMPLE_PREFIX}_h8`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input: "강남에서 오랜만 저녁 먹음 러닝 시작했다고 함",
      parsed_changes: {},
      created_at: d(42),
    },
    {
      id: `${SAMPLE_PREFIX}_h9`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input: "책 추천해줌 읽고 후기 전달하기로",
      parsed_changes: {},
      created_at: d(35),
    },
  ],
};

export const CREATE_EXAMPLES = [
  "김철수 고려대 판교 스타트업 대표 골프 좋아함 자녀 둘",
  "박지영 투자자 시리즈 B 검토 중 테니스 위스키",
  "이현우 카카오 프로덕트 멘토 유니콘 서울대 CS",
];

export const EDIT_EXAMPLES = [
  "골프 아니고 테니스임",
  "최근에 CTO로 승진",
  "다음 주 커피 약속 잡기",
];
