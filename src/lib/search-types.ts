/**
 * 검색의 타입과 상수. 클라이언트에서도 안전하게 가져올 수 있습니다.
 * 실제 검색 구현(임베딩 호출 포함)은 server-only 인 @/lib/search 에 있습니다.
 */

export const DEFAULT_TOP_K = 5;
export const MAX_TOP_K = 10;

export const KEYWORD_SOURCE = "키워드";
export const VECTOR_SOURCE = "벡터";

/** 검색 대상 조각. 조각 나누기 기준은 /chunks 화면의 기본값과 같습니다. */
export type SearchChunk = {
  id: string;
  fileName: string;
  title: string | null;
  index: number;
  text: string;
};

export type SearchHit = {
  rank: number;
  chunk: SearchChunk;
  /** BM25 점수 또는 코사인 유사도. 하이브리드는 RRF 점수 */
  score: number;
  /** 하이브리드에서만 채워집니다. 어느 검색기의 몇 위였는지 */
  ranks?: Record<string, number>;
};

export type SearchResponse = {
  query: string;
  queryTokens: string[];
  chunkCount: number;
  keyword: SearchHit[];
  vector: SearchHit[];
  hybrid: SearchHit[];
  timings: { keyword: number; vector: number; hybrid: number };
};
