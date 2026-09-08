import { convertToModelMessages, streamText } from "ai";

import { CHAT_MODEL, buildSystemPrompt, chatModel } from "@/lib/ai";
import { extractLatestSources, type ChatUIMessage } from "@/lib/attachments";

// OpenAI 호출은 서버에서만 일어납니다. 키는 응답에 절대 포함되지 않습니다.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "서버에 OPENAI_API_KEY가 없습니다. 로컬은 .env.local, 배포는 Vercel 환경 변수를 확인하세요.",
      },
      { status: 500 },
    );
  }

  let messages: ChatUIMessage[];
  try {
    const body = (await req.json()) as { messages?: ChatUIMessage[] };
    if (!Array.isArray(body.messages)) {
      return Response.json(
        { error: "messages 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }
    messages = body.messages;
  } catch {
    return Response.json(
      { error: "요청 본문을 읽지 못했습니다." },
      { status: 400 },
    );
  }

  // 기본 자료(knowledge/*.md)는 항상 포함하고, 이번 질문에 붙어 온 첨부만
  // 추가로 사용합니다. 첨부 크기는 서버에서 다시 제한합니다.
  const sources = extractLatestSources(messages);

  const result = streamText({
    model: chatModel(),
    system: buildSystemPrompt(sources),
    // data-* 파트는 convertToModelMessages 기본 동작에서 제외됩니다.
    // 자료는 위 시스템 프롬프트로만 전달되므로 턴마다 중복되지 않습니다.
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error(`[api/chat] ${CHAT_MODEL} 호출 실패:`, error);
      return "답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    },
  });
}
