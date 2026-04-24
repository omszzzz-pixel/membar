import LegalPage, { H2, Table } from "@/components/LegalPage";

export const metadata = {
  title: "사업자 정보 · membar",
};

export default function BusinessPage() {
  return (
    <LegalPage title="사업자 정보" lastUpdated="2026-04-24">
      <H2>서비스 제공자</H2>
      <Table
        headers={["항목", "내용"]}
        rows={[
          ["상호", "타이탄엔터프라이즈"],
          ["대표자", "오민식"],
          ["사업자등록번호", "108-24-18998"],
          ["통신판매업 신고번호", "2022-고양일산서-0385"],
          ["사업장 주소", "서울 영등포구 여의도동 국제금융로2길 37 에스트레뉴 2901호"],
          ["대표 이메일", "titan@titan-enterprise.co.kr"],
          ["대표 전화", "02-6951-1028"],
          ["개인정보 보호책임자", "오민식"],
        ]}
      />

      <H2>관련 약관·정책</H2>
      <ul className="mt-3 space-y-2 text-[13.5px]">
        <li>
          <a className="text-gold hover:underline" href="/terms">
            이용약관
          </a>
        </li>
        <li>
          <a className="text-gold hover:underline" href="/privacy">
            개인정보 처리방침
          </a>
        </li>
        <li>
          <a className="text-gold hover:underline" href="/refund">
            환불 정책
          </a>
        </li>
      </ul>

      <H2>사업자 정보 확인</H2>
      <p className="mt-2">
        사업자등록번호 및 통신판매업 신고번호는 국세청
        홈택스(www.hometax.go.kr) 및 공정거래위원회
        (www.ftc.go.kr/bizCommPop.do)에서 조회하실 수 있습니다.
      </p>

      <div className="mt-10 mb-4 rounded-lg bg-paper/5 px-4 py-3 text-[12px] text-paper/60">
        본 정보는 전자상거래법 제10조에 따라 공개됩니다.
      </div>
    </LegalPage>
  );
}
