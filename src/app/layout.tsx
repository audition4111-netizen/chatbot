import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Sans_KR } from "next/font/google";

import "./globals.css";

/**
 * DESIGN.md의 표시 서체 Optimistic VF는 Meta 전용 비공개 폰트라 사용할 수 없습니다.
 * DESIGN.md가 명시한 폴백 체인의 첫 항목 Montserrat을 라틴 문자에 쓰고,
 * 한글은 Noto Sans KR로 이어받습니다. (DESIGN.md > Typography > Font Family)
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-optimistic-fallback",
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "한국어 챗봇",
  description: "gpt-4.1-mini 기반 한국어 어시스턴트",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${montserrat.variable} ${notoSansKr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
