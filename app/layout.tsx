import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { UserProvider } from "@/lib/userContext";
import { InstallProvider } from "@/lib/installContext";

export const metadata: Metadata = {
  title: "membar — 인맥 관리",
  description: "막 쳐도 AI가 정리해주는 인맥 관리 앱",
  manifest: "/manifest.json",
  applicationName: "membar",
  appleWebApp: {
    capable: true,
    title: "membar",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
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

const themeInitScript = `(function(){try{var t=localStorage.getItem('membar_theme')||localStorage.getItem('inmaek_theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

const swRegisterScript = `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`;

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
