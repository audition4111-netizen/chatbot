"use client";

import Link from "next/link";
import { RotateCcw, Scissors, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * DESIGN.md > Navigation > Top Navigation
 * 스티키 흰색 바, 높이 ~64px, 하단 1px hairline-soft.
 * 좌: 워드마크 / 우: 원형 아이콘 버튼(button-icon-circular).
 */
export function TopNav({ onReset }: { onReset: () => void }) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-hairline-soft bg-canvas">
      <div className="mx-auto flex h-[64px] max-w-[820px] items-center justify-between px-xl md:px-xxl">
        <span className="text-subtitle-lg font-bold tracking-[-0.16px] text-ink-deep">
          챗봇
        </span>

        <div className="flex items-center gap-xs">
          <Button asChild variant="pillTab" size="pill" className="max-sm:hidden">
            <Link href="/chunks">
              <Scissors size={14} strokeWidth={2.5} aria-hidden />
              문서 조각 보기
            </Link>
          </Button>

          <Button asChild variant="pillTab" size="pill" className="max-sm:hidden">
            <Link href="/search">
              <Search size={14} strokeWidth={2.5} aria-hidden />
              검색 비교
            </Link>
          </Button>

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
      </div>
    </header>
  );
}
