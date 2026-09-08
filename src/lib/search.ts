import "server-only";

import { cosineSimilarity, embed, embedMany } from "ai";

import { embeddingModel } from "@/lib/ai";
import { Bm25Index, toBm25Document } from "@/lib/bm25";
import { DEFAULT_CHUNK_OPTIONS, chunkDocument } from "@/lib/chunking";
import {
  KNOWLEDGE_DOCUMENTS,
  isActiveOn,
  isRetired,
  todayIso,
  type KnowledgeDocument,
} from "@/lib/knowledge";
import { reciprocalRankFusion } from "@/lib/rrf";
import {
  DEFAULT_FILTERS,
  DEFAULT_TOP_K,
  KEYWORD_SOURCE,
  MAX_TOP_K,
  VECTOR_SOURCE,
  type ScopeDocument,
  type SearchChunk,
  type SearchFilters,
  type SearchHit,
  type SearchResponse,
  type SearchScope,
} from "@/lib/search-types";
import { uniqueTokens } from "@/lib/tokenize";

/** 조각 + 검색에 필요한 사전 계산 결과 */
type IndexedChunk = SearchChunk & {
  tokens: string[];
  embedding: number[];
};

type Corpus = {
  chunks: IndexedChunk[];
  byId: Map<string, IndexedChunk>;
};

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

/**
 * 토큰과 임베딩은 인스턴스마다 한 번만 만들고 재사용합니다.
 * 필터는 이 결과를 부분집합으로 잘라서 쓰기 때문에 다시 계산하지 않습니다.
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
      const indexed: IndexedChunk[] = chunks.map((chunk, index) => ({
        ...chunk,
        tokens: toBm25Document(chunk.id, chunk.text).tokens,
        embedding: embeddings[index],
      }));
      return {
        chunks: indexed,
        byId: new Map(indexed.map((chunk) => [chunk.id, chunk])),
      };
    })().catch((error) => {
      // 실패한 프라미스를 캐시에 남기면 다음 요청도 계속 실패합니다.
      corpusPromise = null;
      throw error;
    });
  }
  return corpusPromise;
}

/** 문서 하나가 필터를 통과하는지 판단하고, 막혔다면 그 이유를 돌려줍니다. */
function excludeReason(
  document: KnowledgeDocument,
  filters: SearchFilters,
  asOf: string | null,
): string | null {
  if (
    filters.fileNames.length > 0 &&
    !filters.fileNames.includes(document.fileName)
  ) {
    return "문서 선택에서 제외";
  }

  if (filters.periodMode === "current") {
    if (isRetired(document)) return "적용 종료된 문서";
    if (asOf && !isActiveOn(document, asOf)) {
      return `${asOf} 기준 적용 기간이 아님`;
    }
  }

  if (filters.periodMode === "date" && asOf && !isActiveOn(document, asOf)) {
    return `${asOf} 기준 적용 기간이 아님`;
  }

  return null;
}

/** 필터를 적용해 검색 대상 조각과 범위 정보를 만듭니다. */
function applyFilters(
  corpus: Corpus,
  filters: SearchFilters,
): { chunks: IndexedChunk[]; scope: SearchScope } {
  const asOf =
    filters.periodMode === "current"
      ? todayIso()
      : filters.periodMode === "date"
        ? filters.asOf
        : null;

  const chunkCounts = new Map<string, number>();
  for (const chunk of corpus.chunks) {
    chunkCounts.set(chunk.fileName, (chunkCounts.get(chunk.fileName) ?? 0) + 1);
  }

  const documents: ScopeDocument[] = KNOWLEDGE_DOCUMENTS.map((document) => {
    const reason = excludeReason(document, filters, asOf);
    return {
      fileName: document.fileName,
      title: document.title,
      version: document.version,
      period: document.period,
      status: document.status,
      included: reason === null,
      excludedReason: reason,
      chunkCount: reason === null ? (chunkCounts.get(document.fileName) ?? 0) : 0,
    };
  });

  const included = new Set(
    documents.filter((doc) => doc.included).map((doc) => doc.fileName),
  );
  // 키워드와 벡터가 반드시 같은 모집단을 보도록, 검색 전에 한 번만 자릅니다.
  const chunks = corpus.chunks.filter((chunk) => included.has(chunk.fileName));

  return {
    chunks,
    scope: {
      documents,
      includedDocuments: included.size,
      totalDocuments: KNOWLEDGE_DOCUMENTS.length,
      chunkCount: chunks.length,
      totalChunkCount: corpus.chunks.length,
      periodMode: filters.periodMode,
      asOf,
    },
  };
}

export async function search(
  query: string,
  topK: number = DEFAULT_TOP_K,
  filters: SearchFilters = DEFAULT_FILTERS,
): Promise<SearchResponse> {
  const limit = Math.min(Math.max(1, Math.floor(topK)), MAX_TOP_K);
  const corpus = await getCorpus();
  const { chunks, scope } = applyFilters(corpus, filters);

  const empty: SearchResponse = {
    query,
    queryTokens: uniqueTokens(query),
    chunkCount: chunks.length,
    scope,
    keyword: [],
    vector: [],
    hybrid: [],
    timings: { keyword: 0, vector: 0, hybrid: 0 },
  };

  if (chunks.length === 0) return empty;

  const byId = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  // 색인을 좁혀진 집합으로 다시 만듭니다.
  // IDF가 검색 대상 집합 기준으로 계산되어야 점수가 맞습니다.
  const keywordStart = performance.now();
  const bm25 = new Bm25Index(
    chunks.map((chunk) => ({ id: chunk.id, tokens: chunk.tokens })),
  );
  const keywordRanked = bm25.search(query);
  const keywordMs = performance.now() - keywordStart;

  const vectorStart = performance.now();
  const { embedding } = await embed({ model: embeddingModel(), value: query });
  const vectorRanked = chunks
    .map((chunk) => ({
      id: chunk.id,
      score: cosineSimilarity(embedding, chunk.embedding),
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
      const chunk = byId.get(hit.id);
      if (!chunk) return [];
      // 토큰과 임베딩은 응답에서 제외합니다. 조각마다 1,536개 실수라
      // 그대로 실어 보내면 응답이 수백 KB가 됩니다.
      return [
        {
          rank: index + 1,
          chunk: {
            id: chunk.id,
            fileName: chunk.fileName,
            title: chunk.title,
            index: chunk.index,
            text: chunk.text,
          },
          score: hit.score,
          ranks: hit.ranks,
        },
      ];
    });

  return {
    ...empty,
    keyword: toHits(keywordRanked),
    vector: toHits(vectorRanked),
    hybrid: toHits(fused),
    timings: { keyword: keywordMs, vector: vectorMs, hybrid: hybridMs },
  };
}
