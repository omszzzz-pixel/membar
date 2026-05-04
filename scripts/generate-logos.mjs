import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "logos");
fs.mkdirSync(outDir, { recursive: true });

// 1. 메인 아이콘 (둥근 모서리, App Store/Play Store/홈화면 아이콘용)
const ICON_SVG = fs.readFileSync(
  path.join(root, "public", "icon.svg"),
  "utf8"
);

// 2. Maskable 아이콘 (정사각형 풀블리드, Android adaptive icon용)
const MASKABLE_SVG = fs.readFileSync(
  path.join(root, "public", "icon-maskable.svg"),
  "utf8"
);

// 3. Path 기반 (폰트 의존성 0, 백업)
const PATH_SVG = fs.readFileSync(
  path.join(root, "scripts", "logo-source.svg"),
  "utf8"
);

const SIZES = [
  16, 32, 48, 64, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024,
];

async function renderAt(svg, size, outName) {
  await sharp(Buffer.from(svg), { density: Math.max(72, size / 2) })
    .resize(size, size, { fit: "contain" })
    .png()
    .toFile(path.join(outDir, outName));
  return outName;
}

async function main() {
  const generated = [];

  // 라운드 코너 아이콘 (메인)
  for (const size of SIZES) {
    const name = `membar-icon-${size}.png`;
    await renderAt(ICON_SVG, size, name);
    generated.push(name);
  }

  // Maskable (Android adaptive — 풀블리드)
  for (const size of [192, 512, 1024]) {
    const name = `membar-icon-maskable-${size}.png`;
    await renderAt(MASKABLE_SVG, size, name);
    generated.push(name);
  }

  // Path 기반 백업 (폰트 렌더링 문제 시 비교용)
  for (const size of [512, 1024]) {
    const name = `membar-icon-path-${size}.png`;
    await renderAt(PATH_SVG, size, name);
    generated.push(name);
  }

  // 옆으로 긴 로고 (이메일/배너용) — "m" 아이콘 + "membar" 텍스트
  const wideSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200">
    <rect width="200" height="200" rx="44" ry="44" fill="#ff6f0f"/>
    <text x="100" y="100" font-family="Arial Black, Arial, sans-serif" font-size="140" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="central" letter-spacing="-6">m</text>
    <text x="240" y="100" font-family="Arial, sans-serif" font-size="80" font-weight="800" fill="#1a1a1d" dominant-baseline="central" letter-spacing="-3">membar</text>
  </svg>`;
  for (const w of [600, 1200, 2400]) {
    const h = Math.round(w / 3);
    const name = `membar-wordmark-${w}x${h}.png`;
    await sharp(Buffer.from(wideSvg), { density: Math.max(72, w / 4) })
      .resize(w, h, { fit: "contain" })
      .png()
      .toFile(path.join(outDir, name));
    generated.push(name);
  }

  // OG 이미지 스타일 (1200x630, SNS 공유)
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF7EE"/>
        <stop offset="55%" stop-color="#FFE8D1"/>
        <stop offset="100%" stop-color="#FFD5A8"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <g transform="translate(80 80)">
      <rect width="80" height="80" rx="18" ry="18" fill="#ff6f0f"/>
      <text x="40" y="40" font-family="Arial Black, Arial, sans-serif" font-size="56" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="central" letter-spacing="-2">m</text>
    </g>
    <text x="180" y="120" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="#1a1a1d" dominant-baseline="central" letter-spacing="-2">membar</text>
    <text x="80" y="320" font-family="Arial, sans-serif" font-size="86" font-weight="800" fill="#1a1a1d" letter-spacing="-3">막 쳐도 AI가</text>
    <text x="80" y="420" font-family="Arial, sans-serif" font-size="86" font-weight="800" fill="#ff6f0f" letter-spacing="-3">알아서 정리.</text>
    <text x="80" y="540" font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="#52525B">누구랑 무슨 얘기 했는지 기억나세요?</text>
    <text x="1080" y="580" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ff6f0f" text-anchor="end">membar.kr</text>
  </svg>`;
  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630, { fit: "contain" })
    .png()
    .toFile(path.join(outDir, "membar-og-1200x630.png"));
  generated.push("membar-og-1200x630.png");

  console.log(`\n✅ ${generated.length}개 파일 생성됨 → ${outDir}\n`);
  generated.forEach((n) => console.log("  · " + n));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
