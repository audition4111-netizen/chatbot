"use client";

import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "회의록을 3줄로 요약해줘",
  "정중한 거절 메일을 써줘",
  "맞춤법을 고쳐줘",
];

/**
 * 첫 화면. DESIGN.md의 여백 철학에 따라 요소를 최소로 두고
 * 헤드라인(heading-lg / 모바일 heading-sm)과 제안 칩(button-pill-tab)만 남깁니다.
 */
export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-xl py-section-sm">
      <h1 className="text-heading-sm md:text-heading-lg text-ink-deep">
        무엇을 도와드릴까요?
      </h1>

      <div className="flex flex-wrap gap-xs">
        {SUGGESTIONS.map((text) => (
          <Button
            key={text}
            type="button"
            variant="pillTab"
            size="pill"
            onClick={() => onPick(text)}
          >
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
}
