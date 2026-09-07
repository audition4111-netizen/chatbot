"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessage, ThinkingBubble } from "@/components/chat/chat-message";
import { EmptyState } from "@/components/chat/empty-state";
import { TopNav } from "@/components/chat/top-nav";

export function ChatPanel() {
  const { messages, sendMessage, status, error, stop, setMessages, regenerate } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

  const isBusy = status === "submitted" || status === "streaming";
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // 새 메시지가 들어오면 아래로 붙입니다.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = React.useCallback(
    (text: string) => {
      void sendMessage({ text });
    },
    [sendMessage],
  );

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <TopNav onReset={() => setMessages([])} />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="대화 내용"
      >
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-xl px-xl py-xxl md:px-xxl">
          {messages.length === 0 ? (
            <EmptyState onPick={send} />
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {status === "submitted" && <ThinkingBubble />}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-md rounded-xl border border-critical-strong bg-canvas p-xl"
            >
              <AlertTriangle
                size={20}
                className="mt-xxs shrink-0 text-critical-strong"
                aria-hidden
              />
              <div className="flex flex-col gap-md">
                <div className="flex items-center gap-xs">
                  <Badge variant="critical">오류</Badge>
                </div>
                <p className="text-body-sm text-charcoal">
                  답변을 받지 못했습니다. 네트워크 상태와 서버의 OPENAI_API_KEY
                  설정을 확인한 뒤 다시 시도해 주세요.
                </p>
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="ghost"
                    onClick={() => void regenerate()}
                  >
                    다시 시도
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 입력 영역: 스티키 패널 (DESIGN.md > Elevation level 2) */}
      <div className="border-t border-hairline-soft bg-canvas">
        <div className="mx-auto w-full max-w-[820px] px-xl py-base md:px-xxl">
          <ChatComposer onSubmit={send} onStop={stop} isBusy={isBusy} />
          <p className="mt-xs text-caption text-stone">
            AI가 생성한 답변은 부정확할 수 있습니다. 중요한 내용은 직접 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
