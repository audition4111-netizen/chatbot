import { embed, embedMany, cosineSimilarity } from "ai";
import { embeddingModel } from "@/lib/ai";

/**
 * text-embedding-3-small 기반 임베딩 헬퍼 (서버 전용).
 * 검색/RAG 기능을 붙일 때 여기에서 확장합니다.
 */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel(),
    value: text,
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: embeddingModel(),
    values: texts,
  });
  return embeddings;
}

export { cosineSimilarity };
