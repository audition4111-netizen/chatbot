import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SourceDetails } from "@/components/chat/source-details";
import type { ChatUIMessage, SourceFile } from "@/lib/attachments";
import { cn } from "@/lib/utils";

/**
 * 메시지 버블은 DESIGN.md의 카드 규칙에서 파생했습니다.
 * - 어시스턴트: canvas + hairline-soft 1px, 그림자 없음
 * - 사용자: card-promo-strip 계열(ink-deep 배경 + canvas 텍스트)
 * - 라운딩은 {rounded.xxl}(24px), 본문은 {typography.body-md} (line-height 1.50 유지)
 */
export function ChatMessage({ message }: { message: ChatUIMessage }) {
  const isUser = message.role === "user";

  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("");

  const sources: SourceFile[] = message.parts.flatMap((part) =>
    part.type === "data-sources" ? part.data.files : [],
  );

  if (!text && sources.length === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full animate-surface-in gap-md",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <Avatar className="mt-xxs bg-ink-deep">
          <AvatarFallback className="bg-ink-deep text-canvas">AI</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[min(680px,82%)] flex-col gap-xs",
          isUser ? "items-end" : "items-start",
        )}
      >
        {text && (
          <div
            className={cn(
              "rounded-xxl px-xl py-base text-body-md whitespace-pre-wrap break-words",
              isUser
                ? "bg-ink-deep text-canvas"
                : "border border-hairline-soft bg-canvas text-ink",
            )}
          >
            {text}
          </div>
        )}

        {sources.length > 0 && <SourceDetails files={sources} />}
      </div>

      {isUser && (
        <Avatar className="mt-xxs bg-surface-soft">
          <AvatarFallback className="bg-surface-soft text-steel">
            나
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

/** 스트리밍 시작 전 대기 표시 */
export function ThinkingBubble() {
  return (
    <div className="flex w-full animate-surface-in gap-md">
      <Avatar className="mt-xxs bg-ink-deep">
        <AvatarFallback className="bg-ink-deep text-canvas">AI</AvatarFallback>
      </Avatar>
      <div className="rounded-xxl border border-hairline-soft bg-canvas px-xl py-base">
        <span className="flex items-center gap-xs" aria-label="답변 생성 중">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-[6px] rounded-full bg-stone"
      style={{
        animation: "caret-blink 1.2s ease-in-out infinite",
        animationDelay: delay,
      }}
    />
  );
}
