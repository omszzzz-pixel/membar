import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "logos");
fs.mkdirSync(outDir, { recursive: true });

const ORANGE = "#ff6f0f";
const ORANGE_LIGHT = "#fff1e3";
const ORANGE_HEART_BG = "#fff1e3";
const FONT =
  "'Malgun Gothic', 'Apple SD Gothic Neo', 'Pretendard', sans-serif";

/** 폰 모형 (만남 전 브리핑). 비율 1:2.05 */
function phoneMockup(x, y, w) {
  const h = w * 2.05;
  const px = w * 0.05;
  const sx = x + px;
  const sw = w - px * 2;
  const sbY = y + w * 0.13;
  const hdY = sbY + w * 0.12;
  const avR = w * 0.07;

  const cardStart = hdY + w * 0.18;
  const cardW = sw - px;
  const cardX = sx + px / 2;
  const cardGap = w * 0.035;

  const card1H = w * 0.32;
  const card2H = w * 0.4;
  const card3H = w * 0.4;
  const card4H = w * 0.4;

  const c1Y = cardStart;
  const c2Y = c1Y + card1H + cardGap;
  const c3Y = c2Y + card2H + cardGap;
  const c4Y = c3Y + card3H + cardGap;

  const fsTitle = w * 0.058;
  const fsName = w * 0.042;
  const fsSection = w * 0.044;
  const fsBody = w * 0.034;
  const fsBullet = w * 0.032;
  const cp = w * 0.035;

  function cardHeader(cy, icon, title, iconBg) {
    const iconSize = w * 0.07;
    const iconY = cy + cp;
    return `
      <rect x="${cardX + cp}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.25}" fill="${iconBg}"/>
      <text x="${cardX + cp + iconSize / 2}" y="${iconY + iconSize / 2 + iconSize * 0.04}" font-family="${FONT}" font-size="${iconSize * 0.55}" text-anchor="middle" dominant-baseline="central">${icon}</text>
      <text x="${cardX + cp + iconSize + cp * 0.7}" y="${iconY + iconSize / 2}" font-family="${FONT}" font-size="${fsSection}" font-weight="800" fill="#1a1a1d" dominant-baseline="central">${title}</text>
    `;
  }

  function bullet(cy, text) {
    return `
      <circle cx="${cardX + cp + w * 0.012}" cy="${cy + fsBullet * 0.5}" r="${w * 0.007}" fill="#52525B"/>
      <text x="${cardX + cp + w * 0.035}" y="${cy + fsBullet * 0.5}" font-family="${FONT}" font-size="${fsBullet}" font-weight="500" fill="#1a1a1d" dominant-baseline="central">${text}</text>
    `;
  }

  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.13}" fill="#1a1a1d"/>
    <rect x="${x + w * 0.025}" y="${y + w * 0.025}" width="${w * 0.95}" height="${h - w * 0.05}" rx="${w * 0.105}" fill="white"/>
    <rect x="${x + w * 0.32}" y="${y + w * 0.045}" width="${w * 0.36}" height="${w * 0.07}" rx="${w * 0.035}" fill="#1a1a1d"/>

    <text x="${sx + cp}" y="${sbY}" font-family="${FONT}" font-size="${w * 0.038}" font-weight="700" fill="#1a1a1d" dominant-baseline="central">9:41</text>
    <text x="${sx + sw - cp}" y="${sbY}" font-family="${FONT}" font-size="${w * 0.038}" font-weight="700" fill="#1a1a1d" text-anchor="end" dominant-baseline="central">··· 📶</text>

    <circle cx="${sx + avR + cp * 0.5}" cy="${hdY + avR}" r="${avR}" fill="${ORANGE}"/>
    <text x="${sx + avR + cp * 0.5}" y="${hdY + avR + avR * 0.05}" font-family="${FONT}" font-size="${avR * 1.05}" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="central">홍</text>
    <text x="${sx + avR * 2 + cp * 1.5}" y="${hdY + avR * 0.7}" font-family="${FONT}" font-size="${fsTitle}" font-weight="900" fill="#1a1a1d" dominant-baseline="central">만남 전 브리핑</text>
    <text x="${sx + avR * 2 + cp * 1.5}" y="${hdY + avR * 1.6}" font-family="${FONT}" font-size="${fsName}" font-weight="600" fill="#52525B" dominant-baseline="central">홍지호</text>
    <text x="${sx + sw - cp}" y="${hdY + avR}" font-family="${FONT}" font-size="${w * 0.06}" fill="#52525B" text-anchor="end" dominant-baseline="central">···</text>

    <rect x="${cardX}" y="${c1Y}" width="${cardW}" height="${card1H}" rx="${w * 0.04}" fill="#F5F5F5"/>
    ${cardHeader(c1Y, "📈", "최근 상황", ORANGE_LIGHT)}
    <text x="${cardX + cp}" y="${c1Y + cp + w * 0.115}" font-family="${FONT}" font-size="${fsBody}" font-weight="500" fill="#1a1a1d">시리즈 B 150억 라운드 진행 중이라</text>
    <text x="${cardX + cp}" y="${c1Y + cp + w * 0.16}" font-family="${FONT}" font-size="${fsBody}" font-weight="500" fill="#1a1a1d">요즘 번아웃 심함. CTO 후보 3명 고민 중.</text>

    <rect x="${cardX}" y="${c2Y}" width="${cardW}" height="${card2H}" rx="${w * 0.04}" fill="#F5F5F5"/>
    ${cardHeader(c2Y, "💬", "지난번 핵심 대화", ORANGE_LIGHT)}
    ${bullet(c2Y + cp + w * 0.115, "글로벌 진출은 내년 하반기부터 본격화")}
    ${bullet(c2Y + cp + w * 0.155, "조직문화는 '자율과 책임' 원칙 중시")}
    ${bullet(c2Y + cp + w * 0.195, "제품보다 사람·팀에 더 큰 관심")}

    <rect x="${cardX}" y="${c3Y}" width="${cardW}" height="${card3H}" rx="${w * 0.04}" fill="#F5F5F5"/>
    ${cardHeader(c3Y, "💡", "이번에 꺼낼 얘기", ORANGE_LIGHT)}
    ${bullet(c3Y + cp + w * 0.115, "CTO 후보군 의사결정 레퍼런스 공유")}
    ${bullet(c3Y + cp + w * 0.155, "글로벌 진출 경험자 네트워크 제안")}
    ${bullet(c3Y + cp + w * 0.195, "번아웃·리더십 루틴 인사이트 나누기")}

    <rect x="${cardX}" y="${c4Y}" width="${cardW}" height="${card4H}" rx="${w * 0.04}" fill="${ORANGE_HEART_BG}"/>
    ${cardHeader(c4Y, "❤️", "주의·배려", "white")}
    ${bullet(c4Y + cp + w * 0.115, "투자 제안보다 조언·정보 교류가 적절")}
    ${bullet(c4Y + cp + w * 0.155, "번아웃 얘기는 공감하되 해결책은 조심")}
    ${bullet(c4Y + cp + w * 0.195, "시간 약속 철저히 지켜 신뢰 형성")}
  `;
}

// 1:1 (1080x1080) — 좌측 텍스트 + 우측 폰
async function build1x1() {
  const W = 1080;
  const H = 1080;
  const phoneW = 470;
  const phoneH = phoneW * 2.05;
  const phoneX = W - phoneW - 40;
  const phoneY = (H - phoneH) / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${ORANGE}"/>
    <text x="60" y="100" font-family="${FONT}" font-size="40" font-weight="700" fill="white">membar</text>
    <text x="60" y="280" font-family="${FONT}" font-size="76" font-weight="900" fill="white" letter-spacing="-2">이 사람이 뭘</text>
    <text x="60" y="368" font-family="${FONT}" font-size="76" font-weight="900" fill="white" letter-spacing="-2">좋아했더라...?</text>
    <text x="60" y="540" font-family="${FONT}" font-size="34" font-weight="700" fill="white" opacity="0.95">그냥 막 던지면</text>
    <text x="60" y="590" font-family="${FONT}" font-size="34" font-weight="700" fill="white" opacity="0.95">AI가 한 페이지로</text>
    <text x="60" y="640" font-family="${FONT}" font-size="34" font-weight="700" fill="white" opacity="0.95">정리해드려요</text>
    <text x="60" y="980" font-family="${FONT}" font-size="32" font-weight="800" fill="white">membar.kr</text>
    <text x="60" y="1024" font-family="${FONT}" font-size="22" font-weight="600" fill="white" opacity="0.85">월 4,990원부터 · 5명까지 무료</text>
    ${phoneMockup(phoneX, phoneY, phoneW)}
  </svg>`;

  await sharp(Buffer.from(svg))
    .resize(W, H, { fit: "contain" })
    .png()
    .toFile(path.join(outDir, "membar-ad-1x1-1080.png"));
  console.log("· membar-ad-1x1-1080.png");
}

// 9:16 (1080x1920) — 상단 헤드라인 + 중앙 폰 + 하단 CTA
async function build9x16() {
  const W = 1080;
  const H = 1920;
  const phoneW = 540;
  const phoneH = phoneW * 2.05;
  const phoneX = (W - phoneW) / 2;
  const phoneY = 460;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${ORANGE}"/>
    <text x="${W / 2}" y="140" font-family="${FONT}" font-size="44" font-weight="700" fill="white" text-anchor="middle">membar</text>
    <text x="${W / 2}" y="290" font-family="${FONT}" font-size="92" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-3">이 사람이 뭘</text>
    <text x="${W / 2}" y="395" font-family="${FONT}" font-size="92" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-3">좋아했더라...?</text>
    ${phoneMockup(phoneX, phoneY, phoneW)}
    <text x="${W / 2}" y="${phoneY + phoneH + 70}" font-family="${FONT}" font-size="48" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-2">그냥 던지면 AI가 정리해요</text>
    <text x="${W / 2}" y="${H - 90}" font-family="${FONT}" font-size="38" font-weight="800" fill="white" text-anchor="middle">membar.kr</text>
    <text x="${W / 2}" y="${H - 40}" font-family="${FONT}" font-size="26" font-weight="600" fill="white" text-anchor="middle" opacity="0.85">월 4,990원부터 · 5명까지 무료</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .resize(W, H, { fit: "contain" })
    .png()
    .toFile(path.join(outDir, "membar-ad-9x16-1080x1920.png"));
  console.log("· membar-ad-9x16-1080x1920.png");
}

async function main() {
  await build1x1();
  await build9x16();
  console.log(`\n✅ 광고 이미지 2개 → ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
