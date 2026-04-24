import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "membar · 막 쳐도 AI가 정리해주는 인맥 관리";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #FFF7EE 0%, #FFE8D1 55%, #FFD5A8 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              background: "#FF6F0F",
              color: "#FFFFFF",
              fontSize: 46,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "-0.02em",
            }}
          >
            m
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "#1a1a1d",
              letterSpacing: "-0.02em",
            }}
          >
            membar
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#1a1a1d",
              letterSpacing: "-0.025em",
            }}
          >
            막 쳐도 AI가
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#FF6F0F",
              letterSpacing: "-0.025em",
            }}
          >
            알아서 정리.
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#52525B",
              marginTop: 16,
              lineHeight: 1.4,
            }}
          >
            누구랑 무슨 얘기 했는지 기억나세요?
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontSize: 22,
              color: "#71717A",
              fontWeight: 600,
            }}
          >
            <span>📝 자동 정리</span>
            <span style={{ color: "#D4D4D8" }}>·</span>
            <span>📋 만남 전 브리핑</span>
            <span style={{ color: "#D4D4D8" }}>·</span>
            <span>🎯 무제한 인맥</span>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#FF6F0F",
            }}
          >
            membar.kr
          </div>
        </div>
      </div>
    ),
    size
  );
}
