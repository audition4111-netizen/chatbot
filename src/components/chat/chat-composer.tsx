"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * DESIGN.md > Inputs & Forms > text-input (44px 높이 기준, rounded.lg, hairline 보더)
 * 전송 버튼은 button-primary(검정 필). 코발트({colors.primary})는 구매 플로우 전용이므로
 * 여기서는 쓰지 않습니다 — DESIGN.md > Do's and Don'ts 참고.
 */
export function ChatComposer({
  onSubmit,
  onStop,
  isBusy,
}: {
  onSubmit: (text: string) => void;
  onStop: () => void;
  isBusy: boolean;
}) {
  const [value, setValue] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // 입력 높이를 내용에 맞춰 늘립니다 (최소 44px = 폼 컨트롤 기준 높이).
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function send() {
    const text = value.trim();
    if (!text || isBusy) return;
    onSubmit(text);
    setValue("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter 전송, Shift+Enter 줄바꿈. 한글 조합 중(IME)에는 전송하지 않습니다.
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="flex items-end gap-md"
    >
      <label htmlFor="chat-input" className="sr-only">
        메시지 입력
      </label>
      <Textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="무엇이든 물어보세요. Enter로 전송, Shift+Enter로 줄바꿈"
        className="min-h-[44px]"
      />

      {isBusy ? (
        <Button
          type="button"
          variant="secondary"
          size="secondary"
          onClick={onStop}
          className="h-[44px] shrink-0"
        >
          <Square size={14} strokeWidth={3} aria-hidden />
          중지
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          size="primary"
          disabled={value.trim().length === 0}
          className="h-[44px] shrink-0"
        >
          <ArrowUp size={16} strokeWidth={3} aria-hidden />
          전송
        </Button>
      )}
    </form>
  );
}
