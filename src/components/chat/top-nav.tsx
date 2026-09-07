"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * DESIGN.md > Navigation > Top Navigation (Desktop)
 * 스티키 흰색 바, 높이 ~64px, 하단 1px hairline-soft.
 * 좌: 워드마크 / 중: 필 탭 / 우: 원형 아이콘 버튼.
 * 768px 미만에서는 필 탭이 접히고 로고 + 아이콘만 남습니다.
 */
export function TopNav({ onReset }: { onReset: () => void }) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-hairline-soft bg-canvas">
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between px-xl md:px-xxl">
        <span className="text-subtitle-lg font-bold tracking-[-0.16px] text-ink-deep">
          한국어 챗봇
        </span>

        <nav aria-label="카테고리" className="hidden items-center gap-xs md:flex">
          <Button variant="pillTabActive" size="pill" type="button">
            챗봇
          </Button>
        </nav>

        <Button
          variant="iconCircular"
          size="icon"
          type="button"
          onClick={onReset}
          aria-label="대화 새로 시작"
          title="대화 새로 시작"
        >
          <RotateCcw size={20} strokeWidth={2} aria-hidden />
        </Button>
      </div>
    </header>
  );
}
