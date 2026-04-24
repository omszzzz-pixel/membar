import type { CapacitorConfig } from "@capacitor/cli";

/**
 * membar Capacitor 설정 (remote URL 모드).
 * 네이티브 앱은 membar.kr을 웹뷰로 로드. 웹 업데이트 = 앱 업데이트 자동 반영.
 * webDir은 remote URL 모드에서도 필수 필드라 public/ 로 지정.
 */
const config: CapacitorConfig = {
  appId: "kr.membar.app",
  appName: "membar",
  webDir: "public",
  server: {
    url: "https://membar.kr",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "automatic",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#FFFFFF",
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
};

export default config;
