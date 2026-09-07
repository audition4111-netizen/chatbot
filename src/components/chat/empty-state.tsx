"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

const SUGGESTIONS = [
  "이 프로젝트 구조를 설명해줘",
  "회의록을 3줄로 요약해줘",
  "정중한 거절 메일을 써줘",
  "맞춤법을 고쳐줘",
];

/**
 * DESIGN.md > hero-band-marketing 축약형 + button-pill-tab 제안 칩.
 * 헤드라인은 heading-lg(36px/500), 서브는 subtitle-md(18px/400) —
 * 모바일에서는 heading-sm(24px)로 내려갑니다.
 */
export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-xxl py-xxl">
      <div className="flex flex-col gap-base">
        <h1 className="text-heading-sm md:text-heading-lg text-ink-deep">
          무엇을 도와드릴까요?
        </h1>
        <p className="text-subtitle-md text-slate">
          한국어로 편하게 물어보세요. 아래 예시를 눌러 바로 시작할 수도 있습니다.
        </p>
      </div>

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

      <div className="grid gap-base sm:grid-cols-2">
        <Card>
          <CardTitle>줄바꿈은 Shift+Enter</CardTitle>
          <CardBody className="mt-xs">
            Enter를 누르면 바로 전송됩니다. 한글 조합 중에는 전송되지 않으니
            안심하고 입력하세요.
          </CardBody>
        </Card>
        <Card>
          <CardTitle>대화는 브라우저에만 남습니다</CardTitle>
          <CardBody className="mt-xs">
            새로고침하거나 우측 상단의 새로 시작 버튼을 누르면 대화가 초기화됩니다.
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
