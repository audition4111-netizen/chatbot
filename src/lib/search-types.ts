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
  scope: SearchScope;
  keyword: SearchHit[];
  vector: SearchHit[];
  hybrid: SearchHit[];
  timings: { keyword: number; vector: number; hybrid: number };
};

/** 적용 기간 필터 방식 */
export type PeriodMode = "all" | "current" | "date";

export type SearchFilters = {
  /** 검색할 파일명 목록. 비어 있으면 "전체"로 봅니다. */
  fileNames: string[];
  periodMode: PeriodMode;
  /** periodMode === "date" 일 때의 기준일 (YYYY-MM-DD) */
  asOf: string | null;
};

export const DEFAULT_FILTERS: SearchFilters = {
  fileNames: [],
  periodMode: "all",
  asOf: null,
};

/** 문서 하나가 이번 검색에 포함됐는지와 그 이유 */
export type ScopeDocument = {
  fileName: string;
  title: string;
  version: string | null;
  period: string | null;
  status: string | null;
  included: boolean;
  /** 제외된 이유. 포함된 경우 null */
  excludedReason: string | null;
  /** 이 문서에서 검색 대상이 된 조각 수 */
  chunkCount: number;
};

/** 실제로 검색이 이뤄진 범위. 요청한 필터가 아니라 적용된 결과입니다. */
export type SearchScope = {
  documents: ScopeDocument[];
  includedDocuments: number;
  totalDocuments: number;
  chunkCount: number;
  totalChunkCount: number;
  periodMode: PeriodMode;
  /** periodMode 가 current/date 일 때 실제로 사용된 기준일 */
  asOf: string | null;
};
