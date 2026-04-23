import type { Briefing, HistoryEntry, Person, TimelineItem } from "./types";

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
      father: "의사 은퇴, 최근 건강 안 좋으심",
      mother: "한국무용 강사",
      siblings: "누나 둘 (둘째 누나 미국 거주)",
      notes: "아내는 피아니스트, 첫째 초1 둘째 3세",
    },
    interests: [
      "골프 (핸디 12)",
      "위스키 (재패니즈 편애)",
      "클래식 음악",
      "등산 (북한산 단골)",
      "와인 (소믈리에 2급)",
    ],
    business: [
      "AI 프로덕트 B2B 확장 검토 중",
      "시리즈 B 150억 라운드 진행 중",
      "CES 2026 참관 예정",
      "최근 CTO 영입 고민",
    ],
    tags: [
      "서울대 CS",
      "유니콘 경험 (전 직장)",
      "프로덕트 멘토",
      "소믈리에",
      "페북 창업동아리",
    ],
    todos: [
      {
        text: "다음 주 판교 몽상 점심 예약 확인",
        done: false,
        created_at: d(1),
      },
      {
        text: "AI 컨퍼런스 VIP 티켓 전달",
        done: true,
        created_at: d(22),
      },
      {
        text: "우리 팀 시니어 디자이너 포지션 추천",
        done: false,
        created_at: d(3),
      },
      {
        text: "위스키 '히비키 21년' 후기 전달",
        done: false,
        created_at: d(8),
      },
      {
        text: "빌린 책 『최고의 팀은 무엇이 다른가』 돌려주기",
        done: false,
        created_at: d(16),
      },
      {
        text: "북한산 등산 같이 가기로",
        done: false,
        created_at: d(25),
      },
    ],
    meetings: [
      { date: d(2).slice(0, 10), place: "판교 몽상", notes: "점심 1시간 예정" },
      {
        date: d(18).slice(0, 10),
        place: "판교",
        notes: "AI 컨퍼런스 후 커피 2시간",
      },
      {
        date: d(40).slice(0, 10),
        place: "전화",
        notes: "30분 멘토링 콜 · 팀빌딩 조언",
      },
      {
        date: d(55).slice(0, 10),
        place: "강남 그랜드 인터컨티넨탈",
        notes: "아내분과 함께 저녁 · 와인 페어링",
      },
      {
        date: d(75).slice(0, 10),
        place: "북한산 백운대",
        notes: "새벽 등산 · 조식",
      },
      {
        date: d(95).slice(0, 10),
        place: "판교 스타벅스 리저브",
        notes: "시리즈 B 피드백 요청",
      },
      {
        date: d(118).slice(0, 10),
        place: "코엑스",
        notes: "스타트업 컨퍼런스 처음 만남",
      },
    ],
    i_said: [
      "우리 시리즈 A 리서치에 2개월 썼다고 했음",
      "리크루팅 전략으로 referral 중심 간다고 말함",
      "우리 CTO 후보 3명 추천받았다고 공유",
      "요즘 번아웃 심하다고 털어놨음",
      "다음 라운드 밸류에이션 고민된다고 얘기",
    ],
    notes:
      "2023년 10월 스타트업 컨퍼런스 네트워킹 세션에서 명함 교환. 이후 매달 한 번 판교 점심이 루틴화. 아내분이 피아니스트라 클래식 얘기 많이 나눔. 첫째 초1 들어가면서 요즘 육아 스트레스. 주변에 시니어 디자이너 찾고 있음. 말은 빠르고 논리적이고 관심사 넓음. 돈 얘기 직설적으로 함. 아버지 건강 걱정 많음.",
    is_favorite: true,
    created_at: d(120),
    last_updated_at: d(1),
  },
  {
    id: `${SAMPLE_PREFIX}_2`,
    user_id: "sample",
    name: "박서연",
    title: "심사역 (Principal)",
    company: "카카오벤처스",
    location: "강남 테헤란로",
    education: "KAIST 경영공학 · UC Berkeley MBA",
    relationship: "투자자 (리드 검토 중)",
    birth_year: 1990,
    family: {
      spouse: false,
      children: 0,
      father: null,
      mother: null,
      siblings: "오빠 (변호사, 뉴욕)",
      notes: "혼자 강남 거주, 고양이 2마리",
    },
    interests: [
      "서핑 (양양 정기 방문)",
      "재즈 (bass 연주)",
      "테니스",
      "럭셔리 피트니스",
      "오마카세",
    ],
    business: [
      "AI 시드/시리즈 A 활발히 투자",
      "헬스케어 버티컬 딥다이브 중",
      "최근 연 2-3건 리드 포지션",
      "올해 남은 투자 4건 남음",
    ],
    tags: [
      "VC",
      "KAIST 창업연대",
      "Berkeley MBA",
      "미국 인맥 풍부",
      "헬스케어 딥다이브",
    ],
    todos: [
      {
        text: "피치덱 v2 보내고 피드백 받기",
        done: false,
        created_at: d(2),
      },
      { text: "텀시트 조건 재검토 요청", done: false, created_at: d(4) },
      {
        text: "리퍼런스 체크 3명 리스트 전달",
        done: true,
        created_at: d(8),
      },
      {
        text: "다음 달 내부 IC(투자심의위) 일정 확인",
        done: false,
        created_at: d(1),
      },
    ],
    meetings: [
      {
        date: d(6).slice(0, 10),
        place: "카카오벤처스 오피스",
        notes: "피치 미팅 1시간 · 시니어 파트너 배석",
      },
      {
        date: d(14).slice(0, 10),
        place: "테헤란로 카페",
        notes: "피치덱 1차 피드백",
      },
      {
        date: d(28).slice(0, 10),
        place: "LA 샌타모니카",
        notes: "출장 중 서핑 후 저녁",
      },
      {
        date: d(50).slice(0, 10),
        place: "강남 오마카세",
        notes: "첫 캐주얼 미팅 (파트너 소개)",
      },
    ],
    i_said: [
      "팀 기술 스택과 고객 검증 단계 자세히 설명",
      "LA 서핑 포인트 추천해줌 (Malibu, El Porto)",
      "직전 라운드 투자자 관계 상황 공유",
      "우리 번레이트 12개월 런웨이 있다고 얘기",
    ],
    notes:
      "LA 출장 우연히 같은 서핑 그룹에서 만남. 처음엔 VC인 줄 몰랐고 1시간 넘게 재즈·서핑 얘기만 함. 귀국 후 카톡으로 피치 요청 받음. 말투 젠틀하고 디테일 많이 파고듦. 재무 숫자에 예민함. 창업자 fit 보는 걸 가장 중시. 오빠가 뉴욕 변호사라 법무 관련 물어볼 때 있음. 재즈 베이시스트로 홍대에서 가끔 공연. 테헤란로 오피스 6층.",
    is_favorite: false,
    created_at: d(52),
    last_updated_at: d(2),
  },
  {
    id: `${SAMPLE_PREFIX}_3`,
    user_id: "sample",
    name: "이준호",
    title: "시니어 개발자",
    company: "현대차 R&D",
    location: "남양연구소",
    education: "포스텍 전산",
    relationship: "대학 동기 (연구실 룸메)",
    birth_year: 1988,
    family: {
      spouse: true,
      children: 1,
      father: null,
      mother: null,
      siblings: "형 한 명",
      notes: "첫째 4살, 둘째 계획 중",
    },
    interests: [
      "러닝 (작년 서울마라톤 풀코스 완주)",
      "보드게임 (Gloomhaven 열심)",
      "위스키 입문 중",
      "커피 (홈카페 장비)",
    ],
    business: [
      "자율주행 Perception 팀",
      "최근 팀장 승진 제안 받음 (고민 중)",
      "사이드 프로젝트로 오픈소스 기여",
    ],
    tags: ["포스텍 전산", "대학동기", "연구실 룸메", "자율주행 전문"],
    todos: [
      { text: "다음 달 생일 챙기기 (12일)", done: false, created_at: d(10) },
      {
        text: "추천해준 책 『미스터리 오브 러브』 후기",
        done: false,
        created_at: d(20),
      },
      {
        text: "팀장 승진 고민 상담 (연말 전)",
        done: false,
        created_at: d(30),
      },
      {
        text: "보드게임 모임 초대 (12월 중순)",
        done: false,
        created_at: d(15),
      },
    ],
    meetings: [
      {
        date: d(42).slice(0, 10),
        place: "강남 '수퍼달링'",
        notes: "6개월만에 저녁 · 3시간 수다",
      },
      {
        date: d(160).slice(0, 10),
        place: "수원 치킨집",
        notes: "작년 가을 · 첫째 돌잔치 언급",
      },
      {
        date: d(195).slice(0, 10),
        place: "포스텍 동문 모임",
        notes: "오랜만 반갑게 만남",
      },
    ],
    i_said: [
      "내 스타트업 최근 상황 공유 (힘든 부분 포함)",
      "이직 고민했던 과정 얘기",
      "팀장 제안 받으면 받으라고 했음 (관리 경험 중요)",
    ],
    notes:
      "포스텍 전산 2학년 때 같은 연구실에서 1년 룸메. 이후 같이 창업 스터디도 함. 졸업 후 현대차 갔고 나는 스타트업. 1-2년에 한 번 볼까말까하지만 만나면 3시간씩 얘기함. 말은 느리지만 깊이 생각함. 자율주행 기술 디테일 잘 알고 최신 논문도 follow. 위스키 입문 시작해서 추천해주면 좋아함. 러닝 하면서 스트레스 푸는 스타일. 첫째 4살 되면서 육아 이야기 자주 나옴.",
    is_favorite: false,
    created_at: d(200),
    last_updated_at: d(42),
  },
];

export const SAMPLE_HISTORY: Record<string, HistoryEntry[]> = {
  [`${SAMPLE_PREFIX}_1`]: [
    {
      id: `${SAMPLE_PREFIX}_1_h1`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "홍지호 네이버 프로덕트 리드 85년생 서울대 CS 판교 유니콘 경험 있음",
      parsed_changes: {},
      created_at: d(118),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h2`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "골프 핸디 12 위스키 재패니즈 편애 클래식 좋아함 와인 소믈리에 2급",
      parsed_changes: {},
      created_at: d(100),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h3`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "부인 피아니스트 자녀 둘 첫째 곧 초등학교 아버지 의사 은퇴 어머니 한국무용 강사",
      parsed_changes: {},
      created_at: d(95),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h4`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "그랜드 인터컨티넨탈 와인페어링 저녁 부인도 같이 왔음 아내분 연세대 출신 공연기획도 가끔 함",
      parsed_changes: {},
      created_at: d(55),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h5`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "요즘 번아웃 심하다고 함 시리즈 B 150억 라운드 진행 중 기존 투자자 팔로우 설득 중",
      parsed_changes: {},
      created_at: d(40),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h6`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input: "CTO 후보 고민 중 3명 후보 있는데 fit이 애매하다고",
      parsed_changes: {},
      created_at: d(30),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h7`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "북한산 백운대 새벽 등산 같이 감 조식까지 등산 핸들러 새로 장만",
      parsed_changes: {},
      created_at: d(25),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h8`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "AI 컨퍼런스 VIP 티켓 받음 내 회사 팀도 초대해줌 B2B 확장 얘기 공감 많음",
      parsed_changes: {},
      created_at: d(22),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h9`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "판교 스벅 리저브 시리즈 B 피드백 받음 텀시트 조건 리뷰해줬음 리스크 2개 짚어줌",
      parsed_changes: {},
      created_at: d(18),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h10`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input: "히비키 21년 맛본 후기 공유하기로 책 한 권 빌려줌",
      parsed_changes: {},
      created_at: d(16),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h11`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "아버지 건강 안 좋으심 최근 병원 자주 가신다고 누나가 지방에서 챙김",
      parsed_changes: {},
      created_at: d(10),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h12`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input:
        "CES 2026 참관 계획 AI 미팅 잡을 예정 시니어 디자이너 추천 요청함",
      parsed_changes: {},
      created_at: d(3),
    },
    {
      id: `${SAMPLE_PREFIX}_1_h13`,
      person_id: `${SAMPLE_PREFIX}_1`,
      raw_input: "다음 주 화요일 판교 몽상 점심 확정",
      parsed_changes: {},
      created_at: d(1),
    },
  ],
  [`${SAMPLE_PREFIX}_2`]: [
    {
      id: `${SAMPLE_PREFIX}_2_h1`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "박서연 카카오벤처스 심사역 90년생 KAIST 경영 버클리 MBA 헬스케어 딥다이브",
      parsed_changes: {},
      created_at: d(50),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h2`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "LA 샌타모니카 서핑 그룹에서 우연히 만남 Malibu El Porto 포인트 추천 받음 재즈 베이시스트 홍대 공연",
      parsed_changes: {},
      created_at: d(48),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h3`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "오빠 뉴욕 변호사 고양이 두 마리 혼자 강남 거주 연 2-3건 리드 투자함",
      parsed_changes: {},
      created_at: d(42),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h4`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "강남 오마카세 첫 캐주얼 미팅 파트너 1분 같이 옴 창업자 fit 제일 중시한다고 함",
      parsed_changes: {},
      created_at: d(50),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h5`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "피치덱 초안 보냄 테헤란로 카페 1차 피드백 재무 숫자 질문 많이 함 런웨이 12개월 얘기",
      parsed_changes: {},
      created_at: d(14),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h6`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "리퍼런스 체크 3명 리스트 전달 완료 두 분은 바로 답장 준다 함",
      parsed_changes: {},
      created_at: d(8),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h7`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "카카오벤처스 오피스 정식 피치 시니어 파트너 참석 Q&A 30분 이상 깊게 감",
      parsed_changes: {},
      created_at: d(6),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h8`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "올해 남은 투자 slot 4건 남았다고 연말 IC 통과시키면 12월 말 종결 가능",
      parsed_changes: {},
      created_at: d(4),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h9`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input: "피치덱 v2 업데이트 요청 받음 재무 섹션 보완 필요",
      parsed_changes: {},
      created_at: d(2),
    },
    {
      id: `${SAMPLE_PREFIX}_2_h10`,
      person_id: `${SAMPLE_PREFIX}_2`,
      raw_input:
        "텀시트 조건 먼저 공유하고 싶다고 함 이번 주 중 보내줄 것",
      parsed_changes: {},
      created_at: d(1),
    },
  ],
  [`${SAMPLE_PREFIX}_3`]: [
    {
      id: `${SAMPLE_PREFIX}_3_h1`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "이준호 포스텍 전산 88년생 대학 연구실 룸메 현대차 R&D 자율주행",
      parsed_changes: {},
      created_at: d(195),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h2`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "포스텍 동문 모임에서 오랜만 반가움 결혼 얘기 나옴 2016년 결혼 첫째 있음",
      parsed_changes: {},
      created_at: d(195),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h3`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "수원 치킨집 저녁 첫째 돌잔치 내년 초 예정 형은 변호사",
      parsed_changes: {},
      created_at: d(160),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h4`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "작년 서울마라톤 풀코스 완주 3시간 58분 자랑스러워함 러닝으로 스트레스 푼다고",
      parsed_changes: {},
      created_at: d(120),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h5`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "자율주행 Perception 팀 최신 논문 follow 중 Waymo 최근 페이퍼 같이 토론함",
      parsed_changes: {},
      created_at: d(80),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h6`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "강남 수퍼달링 저녁 3시간 수다 팀장 승진 제안 받음 고민 중 관리자 가야할지",
      parsed_changes: {},
      created_at: d(42),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h7`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "위스키 입문 중 조니워커 블랙 먼저 맛봄 라가불린 16 추천해주기로 함",
      parsed_changes: {},
      created_at: d(38),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h8`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "책 추천해줌 '미스터리 오브 러브' 읽고 후기 전달하기로 내 스타트업 상황도 공유함",
      parsed_changes: {},
      created_at: d(35),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h9`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "사이드 프로젝트 오픈소스 기여 중 python 라이브러리 보드게임 Gloomhaven 취미",
      parsed_changes: {},
      created_at: d(30),
    },
    {
      id: `${SAMPLE_PREFIX}_3_h10`,
      person_id: `${SAMPLE_PREFIX}_3`,
      raw_input:
        "다음 달 12일 생일 보드게임 모임 초대해보기 12월 중순에 둘째 계획 중이라는 얘기",
      parsed_changes: {},
      created_at: d(15),
    },
  ],
};

/**
 * Pre-crafted briefings for sample persons.
 * These are used instead of hitting the AI API for sample persons —
 * guarantees consistent "wow factor" demo quality + zero API cost.
 */
export const SAMPLE_BRIEFINGS: Record<string, Briefing> = {
  [`${SAMPLE_PREFIX}_1`]: {
    recent_context:
      "시리즈 B 150억 라운드 진행 중이라 요즘 번아웃 심함. CTO 후보 3명 사이에서 고민 많고, 아버지 건강 때문에 마음도 무거움. CES 2026 참관 준비 중.",
    last_conversations: [
      "시리즈 B 텀시트 피드백 받고 리스크 2개 짚어주심",
      "CTO 후보 fit이 애매해서 결정 못 내리고 있는 상태",
      "북한산 새벽 등산 같이 다녀와서 등산 얘기로 친밀감 쌓임",
      "히비키 21년 맛본 후기 공유하기로 약속",
      "아버지 건강 걱정 털어놓으심 (최근에 꺼낸 이야기)",
    ],
    topics_to_mention: [
      "추천했던 시니어 디자이너 후보 2명 프로필 전달",
      "CES 참관 일정 겹치면 현지에서 디너 제안",
      "히비키 21년 마셔본 감상 (꼭 공유하기로 약속함)",
    ],
    followups: [
      "빌린 책 『최고의 팀은 무엇이 다른가』 돌려드리기",
      "AI 컨퍼런스 참가 후기 짧게 보내기",
      "아내분께 안부 전하기 (다음 주 피아노 발표회 있음)",
    ],
    sensitivities: [
      "아버지 건강 얘기는 먼저 꺼내지 말고 물어보시면 응답만",
      "번아웃 상태라 장시간 미팅 부담스러울 수 있음 — 1시간 컷 추천",
      "시리즈 B 투자자 리스트 민감 — 구체적인 VC 이름 언급 조심",
    ],
  },
  [`${SAMPLE_PREFIX}_2`]: {
    recent_context:
      "우리 건 카카오벤처스 내부 IC(투자심의위) 막판 단계. 텀시트 조건 공유하고 싶다고 방금 연락 옴. 올해 남은 투자 slot 4건 중 우리가 1건이 될 가능성 높음.",
    last_conversations: [
      "카카오벤처스 오피스 정식 피치 (시니어 파트너 배석)",
      "리퍼런스 체크 3명 중 2명 바로 답장 줄 것",
      "재무 섹션 피치덱 v2 보완 요청함",
      "창업자 fit 보는 걸 가장 중시한다고 밝힘",
      "연말 IC 통과시키면 12월 말 투자 종결 가능",
    ],
    topics_to_mention: [
      "피치덱 v2 재무 섹션 미리 공유 가능한지 체크",
      "텀시트 조건 전달 전 주요 concern 미리 풀고 가기",
      "최근 LA 서핑 근황 (가벼운 인트로로)",
    ],
    followups: [
      "피치덱 v2 재무 섹션 업데이트해서 송부",
      "리퍼런스 체크 답변 안 온 1명 독촉",
      "오빠 뉴욕 변호사라 법무 질문 있을 때 참고",
    ],
    sensitivities: [
      "재무 숫자에 예민하므로 런웨이·번레이트 숫자 정확하게",
      "파트너 오픈 전에는 내부 상황 디테일 공유 조심",
      "재즈 공연 얘기는 Private 영역 — 물어보면 답하는 정도",
    ],
  },
  [`${SAMPLE_PREFIX}_3`]: {
    recent_context:
      "42일 전 강남 '수퍼달링'에서 3시간 수다. 팀장 승진 제안 받고 고민 중 (관리자 vs 엔지니어 패스). 둘째 계획 중이고 다음 달 12일이 생일.",
    last_conversations: [
      "팀장 승진 제안 받았다고 고민 털어놨음",
      "위스키 입문 중 — 라가불린 16 추천해주기로 약속",
      "책 『미스터리 오브 러브』 추천받고 후기 전달하기로",
      "자율주행 Waymo 최근 페이퍼 같이 토론",
      "첫째 4살 되면서 육아 이야기 많이 나옴",
    ],
    topics_to_mention: [
      "라가불린 16 마셔본 감상 (추천해줬음)",
      "팀장 결정 어떻게 했는지 물어보기 (연말 전 결정한다고 했음)",
      "생일 다음 달 12일 — 무엇 하고 싶은지 슬쩍 물어보기",
    ],
    followups: [
      "책 『미스터리 오브 러브』 후기 간단히 전달",
      "생일 12일 챙기기 — 선물 아이디어 미리 준비",
      "보드게임 모임 12월 중순 날짜 확정되면 초대",
    ],
    sensitivities: [
      "1-2년에 한 번 보는 사이지만 깊은 얘기 편하게 함 — 빠르게 본론 가도 됨",
      "말이 느리니 대화 템포 맞춰주기",
      "육아 피로 있을 때 있음 — 늦은 시간 약속은 부담",
    ],
  },
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

/**
 * Flatten sample history into TimelineItem[] for demo display.
 * Used when real history is empty to show a rich preview.
 */
export function getSampleTimelineItems(): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const person of SAMPLE_PERSONS) {
    const history = SAMPLE_HISTORY[person.id] ?? [];
    for (const h of history) {
      items.push({
        id: h.id,
        person_id: person.id,
        person_name: person.name,
        person_favorite: person.is_favorite,
        raw_input: h.raw_input,
        created_at: h.created_at,
      });
    }
  }
  return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
}
