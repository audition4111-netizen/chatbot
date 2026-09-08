"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KNOWLEDGE_SUMMARIES } from "@/lib/knowledge";

const SUGGESTIONS = [
  "해외 출장 숙박비 한도가 얼마인가요?",
  "올해 교육비 지원 한도를 알려주세요",
  "APP-071 오류는 어떻게 해결하나요?",
];

/**
 * 첫 화면. DESIGN.md의 여백 철학에 따라 요소를 최소로 두고
 * 헤드라인(heading-lg / 모바일 heading-sm)과 제안 칩(button-pill-tab)만 남깁니다.
 * 어떤 자료를 근거로 답하는지는 접힌 목록으로만 알립니다.
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

      <details className="group w-full max-w-[560px] rounded-lg border border-hairline-soft bg-canvas">
        <summary className="flex cursor-pointer list-none items-center gap-xs px-md py-xs text-body-sm text-steel">
          <ChevronRight
            size={16}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 transition-transform duration-200 ease-out group-open:rotate-90"
          />
          <span className="font-bold text-ink">기본 자료</span>
          <span className="text-stone">
            가온서비스 문서 {KNOWLEDGE_SUMMARIES.length}건
          </span>
        </summary>

        <ul className="flex flex-col gap-xs border-t border-hairline-soft p-md">
          {KNOWLEDGE_SUMMARIES.map((doc) => (
            <li key={doc.fileName} className="flex flex-wrap items-center gap-xs">
              <span className="text-body-sm text-ink">{doc.title}</span>
              {doc.version && (
                <span className="text-caption text-stone">v{doc.version}</span>
              )}
              {doc.status && (
                <span className="rounded-pill bg-surface-soft px-xs py-[2px] text-caption font-bold text-steel">
                  {doc.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
