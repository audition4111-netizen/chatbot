import type { SearchChunk } from "@/lib/search-types";

export type PipelineId = "vector" | "hybrid" | "rerank";

export const PIPELINES: Array<{
  id: PipelineId;
  label: string;
  description: string;
}> = [
  { id: "vector", label: "벡터", description: "임베딩 코사인 유사도만" },
  { id: "hybrid", label: "하이브리드", description: "BM25 + 벡터를 RRF로 결합" },
  {
    id: "rerank",
    label: "리랭커",
    description: "하이브리드 후보를 gpt-4.1-mini가 재채점",
  },
];

/** 답변 근거로 실제 넘어간 조각 하나 */
export type RetrievedChunk = {
  chunk: SearchChunk;
  /** 해당 파이프라인의 점수 (벡터=유사도, 하이브리드=RRF, 리랭커=0~10) */
  score: number;
  /** 리랭커에서만: 재정렬 전 순위 */
  previousRank?: number;
  /** 리랭커에서만: 채점 근거 한 줄 */
  reason?: string;
};

export type PipelineResult = {
  id: PipelineId;
  chunks: RetrievedChunk[];
  answer: string;
  sourceFiles: string[];
  /** 검색에 걸린 시간 */
  retrievalMs: number;
  /** 답변 생성에 걸린 시간 */
  answerMs: number;
  totalMs: number;
};

/** 생성이 모두 끝난 뒤에만 응답에 실리는 정답 정보 */
export type GoldStandard = {
  expected: string;
  requiredFiles: string[];
  forbiddenFiles: string[];
  mustInclude: string[];
};

export type EvalRunResult = {
  questionId: string;
  question: string;
  category: string;
  topK: number;
  pipelines: PipelineResult[];
  gold: GoldStandard;
};

export type EvalQuestionSummary = {
  id: string;
  question: string;
  category: string;
};

/** 사람이 매긴 채점과 메모 (브라우저에 저장) */
export type Verdict = "pass" | "fail" | null;

export type QuestionReview = {
  verdicts: Partial<Record<PipelineId, Verdict>>;
  note: string;
  updatedAt: string;
};
