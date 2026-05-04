import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { UserProvider } from "@/lib/userContext";
import { InstallProvider } from "@/lib/installContext";

const SITE_URL = "https://membar.kr";
const SITE_NAME = "membar";
const DEFAULT_TITLE = "membar · 막 쳐도 AI가 정리해주는 인맥 관리";
const DEFAULT_DESCRIPTION =
  "누구 만났는지, 누구한테 무슨 말 했는지 다 기억 못 하는 사람을 위한 AI 인맥 관리. 그냥 막 쳐도 AI가 알아서 이름·회사·관심사·가족·메모까지 구조화해주고, 다음 미팅 전에는 한 페이지 브리핑까지. 영업직·VC·파운더·컨설턴트를 위한 membar.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s · membar",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "인맥 관리",
    "인맥 관리 앱",
    "AI 인맥 관리",
    "비즈니스 인맥",
    "영업 관리",
    "명함 관리",
    "미팅 브리핑",
    "만남 기록",
    "CRM",
    "개인 CRM",
    "사람 기억",
    "인맥 메모",
    "인맥 정리",
    "네트워킹",
    "membar",
    "멤바",
  ],
  authors: [{ name: "타이탄엔터프라이즈", url: SITE_URL }],
  creator: "타이탄엔터프라이즈",
  publisher: "타이탄엔터프라이즈",
  manifest: "/manifest.json",
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "jkd7beL9TBp3R-4hSgKr_-x4zT824bZhigWhKIDf6B0",
    other: {
      "naver-site-verification":
        "0fe34054fd8e68e69dc94331dade9b775d9dd365",
    },
  },
  category: "productivity",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1d" },
  ],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('membar_theme')||localStorage.getItem('inmaek_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

const swRegisterScript = `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "membar",
  alternateName: "멤바",
  description: DEFAULT_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  inLanguage: "ko-KR",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
    description: "무료 체험 · 유료 Pro 요금제 월 4,990원부터",
  },
  publisher: {
    "@type": "Organization",
    name: "타이탄엔터프라이즈",
    url: SITE_URL,
  },
  aggregateRating: undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <UserProvider>
          <InstallProvider>
            <div className="relative mx-auto min-h-dvh max-w-[430px]">
              {children}
            </div>
            <BottomNav />
          </InstallProvider>
        </UserProvider>
      </body>
    </html>
  );
}
