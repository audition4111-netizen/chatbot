import "server-only";

import { generateObject } from "ai";
import { z } from "zod";

import { chatModel } from "@/lib/ai";
import type { SearchChunk } from "@/lib/search-types";

/**
 * LLM 리랭커.
 *
 * OpenAI에는 전용 rerank 엔드포인트가 없어, 채팅 모델에게 후보 조각을
 * 질문 기준으로 채점하게 합니다. 임베딩은 질문과 조각을 각각 벡터로 만들어
 * 비교하지만(bi-encoder), 리랭커는 질문과 조각을 함께 읽고 판단하므로
 * "APP-071 vs APP-107" 처럼 표면이 비슷한 경우를 더 잘 가릅니다.
 */
const scoreSchema = z.object({
  scores: z
    .array(
      z.object({
        index: z.number().int().describe("후보 번호 (1부터)"),
        score: z.number().min(0).max(10).describe("질문에 답하는 데 도움되는 정도"),
        reason: z.string().max(120).describe("한 문장 근거"),
      }),
    )
    .describe("모든 후보에 대한 점수"),
});

export type RerankedChunk = {
  chunk: SearchChunk;
  score: number;
  reason: string;
  /** 리랭킹 전 순위 */
  previousRank: number;
};

export async function rerank(
  query: string,
  candidates: SearchChunk[],
): Promise<RerankedChunk[]> {
  if (candidates.length === 0) return [];

  const passages = candidates
    .map(
      (chunk, index) =>
        `[${index + 1}] (${chunk.fileName} · ${chunk.title ?? "제목 없음"})\n${chunk.text}`,
    )
    .join("\n\n");

  const { object } = await generateObject({
    model: chatModel(),
    schema: scoreSchema,
    system: `당신은 검색 결과를 재정렬하는 채점자입니다.

각 후보가 사용자의 질문에 답하는 데 얼마나 도움이 되는지 0~10으로 매깁니다.
- 10: 질문의 답이 이 후보 안에 직접 들어 있음
- 5: 관련된 주제이지만 답 자체는 없음
- 0: 질문과 무관

주의:
- 오류 코드나 연도처럼 숫자가 조금만 달라도 다른 내용입니다. 정확히 일치하는 후보에만 높은 점수를 줍니다.
- 답을 만들지 말고 점수만 매깁니다.
- 모든 후보에 대해 빠짐없이 점수를 냅니다.`,
    prompt: `질문: ${query}\n\n후보:\n${passages}`,
  });

  const scoreByIndex = new Map(
    object.scores.map((item) => [item.index, item]),
  );

  return candidates
    .map((chunk, index) => {
      const scored = scoreByIndex.get(index + 1);
      return {
        chunk,
        score: scored?.score ?? 0,
        reason: scored?.reason ?? "채점되지 않음",
        previousRank: index + 1,
      };
    })
    .sort((a, b) => b.score - a.score);
}
