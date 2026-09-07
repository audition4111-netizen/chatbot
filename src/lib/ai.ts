import { openai } from "@ai-sdk/openai";

/**
 * 모델 설정 (서버 전용).
 *
 * @ai-sdk/openai 는 서버 환경 변수 OPENAI_API_KEY 를 자동으로 읽습니다.
 * - 로컬: .env.local
 * - Vercel: 프로젝트 Settings > Environment Variables
 * NEXT_PUBLIC_ 접두사 변수에는 절대 키를 넣지 마세요 (브라우저 번들에 그대로 노출됩니다).
 */

/** 채팅 모델 */
export const CHAT_MODEL = "gpt-4.1-mini" as const;

/** 임베딩 모델 */
export const EMBEDDING_MODEL = "text-embedding-3-small" as const;

export const chatModel = () => openai(CHAT_MODEL);
export const embeddingModel = () => openai.textEmbeddingModel(EMBEDDING_MODEL);

/** 한국어 챗봇 기본 시스템 프롬프트 */
export const SYSTEM_PROMPT = `당신은 한국어로 답하는 친절하고 정확한 어시스턴트입니다.

규칙:
- 항상 한국어로 답합니다. 사용자가 다른 언어로 물어도 한국어로 답하되, 고유명사나 코드는 원문을 유지합니다.
- 모르는 것은 모른다고 말하고, 추측을 사실처럼 말하지 않습니다.
- 답변은 핵심부터 간결하게 씁니다. 목록이 도움이 될 때만 목록을 씁니다.
- 존댓말을 사용합니다.`;
