import "server-only";

import { cosineSimilarity, embed, embedMany } from "ai";

import { embeddingModel } from "@/lib/ai";
import { Bm25Index } from "@/lib/bm25";
import { DEFAULT_CHUNK_OPTIONS, chunkDocument } from "@/lib/chunking";
import { KNOWLEDGE_DOCUMENTS } from "@/lib/knowledge";
import { reciprocalRankFusion } from "@/lib/rrf";
import {
  DEFAULT_TOP_K,
  KEYWORD_SOURCE,
  MAX_TOP_K,
  VECTOR_SOURCE,
  type SearchChunk,
  type SearchHit,
  type SearchResponse,
} from "@/lib/search-types";
import { uniqueTokens } from "@/lib/tokenize";


function buildChunks(): SearchChunk[] {
  return KNOWLEDGE_DOCUMENTS.flatMap((document) =>
    chunkDocument(document.fileName, document.text, DEFAULT_CHUNK_OPTIONS).map(
      (chunk) => ({
        id: chunk.id,
        fileName: chunk.fileName,
        title: chunk.title,
        index: chunk.index,
        text: chunk.text,
      }),
    ),
  );
}

type Corpus = {
  chunks: SearchChunk[];
  byId: Map<string, SearchChunk>;
  bm25: Bm25Index;
  embeddings: number[][];
};

/**
 * 조각과 임베딩은 인스턴스마다 한 번만 만들고 재사용합니다.
 * 문서가 2,800자 남짓이라 임베딩은 embedMany 한 번으로 끝납니다.
 */
let corpusPromise: Promise<Corpus> | null = null;

async function getCorpus(): Promise<Corpus> {
  if (!corpusPromise) {
    corpusPromise = (async () => {
      const chunks = buildChunks();
      const { embeddings } = await embedMany({
        model: embeddingModel(),
        values: chunks.map((chunk) => chunk.text),
      });
      return {
        chunks,
        byId: new Map(chunks.map((chunk) => [chunk.id, chunk])),
        bm25: new Bm25Index(chunks.map(({ id, text }) => ({ id, text }))),
        embeddings,
      };
    })().catch((error) => {
      // 실패한 프라미스를 캐시에 남기면 다음 요청도 계속 실패합니다.
      corpusPromise = null;
      throw error;
    });
  }
  return corpusPromise;
}

export async function search(
  query: string,
  topK: number = DEFAULT_TOP_K,
): Promise<SearchResponse> {
  const limit = Math.min(Math.max(1, Math.floor(topK)), MAX_TOP_K);
  const corpus = await getCorpus();

  const keywordStart = performance.now();
  const keywordRanked = corpus.bm25.search(query);
  const keywordMs = performance.now() - keywordStart;

  const vectorStart = performance.now();
  const { embedding } = await embed({ model: embeddingModel(), value: query });
  const vectorRanked = corpus.chunks
    .map((chunk, index) => ({
      id: chunk.id,
      score: cosineSimilarity(embedding, corpus.embeddings[index]),
    }))
    .sort((a, b) => b.score - a.score);
  const vectorMs = performance.now() - vectorStart;

  // RRF는 각 검색기의 상위 목록만 사용합니다.
  // 꼬리까지 넣으면 관련 없는 조각이 점수를 얻습니다.
  const fusionDepth = Math.max(limit * 2, limit + 3);
  const hybridStart = performance.now();
  const fused = reciprocalRankFusion([
    { source: KEYWORD_SOURCE, ids: keywordRanked.slice(0, fusionDepth).map((h) => h.id) },
    { source: VECTOR_SOURCE, ids: vectorRanked.slice(0, fusionDepth).map((h) => h.id) },
  ]);
  const hybridMs = performance.now() - hybridStart;

  const toHits = (
    ranked: Array<{ id: string; score: number; ranks?: Record<string, number> }>,
  ): SearchHit[] =>
    ranked.slice(0, limit).flatMap((hit, index) => {
      const chunk = corpus.byId.get(hit.id);
      if (!chunk) return [];
      return [{ rank: index + 1, chunk, score: hit.score, ranks: hit.ranks }];
    });

  return {
    query,
    queryTokens: uniqueTokens(query),
    chunkCount: corpus.chunks.length,
    keyword: toHits(keywordRanked),
    vector: toHits(vectorRanked),
    hybrid: toHits(fused),
    timings: { keyword: keywordMs, vector: vectorMs, hybrid: hybridMs },
  };
}
