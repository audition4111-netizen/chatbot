import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { CHAT_MODEL, SYSTEM_PROMPT, chatModel } from "@/lib/ai";

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

  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
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

  const result = streamText({
    model: chatModel(),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      // 서버 로그에만 원문을 남기고, 클라이언트에는 한국어 메시지만 보냅니다.
      console.error(`[api/chat] ${CHAT_MODEL} 호출 실패:`, error);
      return "답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    },
  });
}
