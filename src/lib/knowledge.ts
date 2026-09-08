import { KNOWLEDGE_DOCUMENTS } from "@/lib/knowledge-data";

/** knowledge/*.md 에서 구워진 기본 자료 한 건 */
export type KnowledgeDocument = {
  fileName: string;
  title: string;
  /** 문서 버전 (예: "2026-01") */
  version: string | null;
  /** 적용 기간 (예: "2026-01-01~현재") */
  period: string | null;
  /** "적용 종료" 처럼 명시된 상태. 없으면 null */
  status: string | null;
  text: string;
};

export { KNOWLEDGE_DOCUMENTS };

/** 화면에 목록으로 보여줄 때 쓰는 요약 정보 (본문 제외) */
export type KnowledgeSummary = Omit<KnowledgeDocument, "text"> & {
  chars: number;
};

export const KNOWLEDGE_SUMMARIES: KnowledgeSummary[] = KNOWLEDGE_DOCUMENTS.map(
  ({ text, ...rest }) => ({ ...rest, chars: text.length }),
);

export const KNOWLEDGE_TOTAL_CHARS = KNOWLEDGE_DOCUMENTS.reduce(
  (sum, doc) => sum + doc.text.length,
  0,
);

/** 시스템 프롬프트에 넣을 기본 자료 블록 */
export function renderKnowledgeBlock(): string {
  return KNOWLEDGE_DOCUMENTS.map((doc) => {
    const meta = [
      `파일명: ${doc.fileName}`,
      doc.version ? `문서 버전: ${doc.version}` : null,
      doc.period ? `적용 기간: ${doc.period}` : null,
      doc.status ? `상태: ${doc.status}` : null,
    ]
      .filter(Boolean)
      .join(" / ");

    return `[문서] ${meta}\n${doc.text}`;
  }).join("\n\n---\n\n");
}

/** "2026-01-01~현재" / "2025-01-01~2025-12-31" 형태를 해석한 결과 */
export type DocumentPeriod = {
  /** YYYY-MM-DD. 알 수 없으면 null */
  start: string | null;
  /** YYYY-MM-DD. "현재"처럼 끝이 열려 있으면 null */
  end: string | null;
};

const DATE = /(\d{4}-\d{2}-\d{2})/g;

/** 적용 기간 문자열을 시작일과 종료일로 나눕니다. */
export function parsePeriod(period: string | null): DocumentPeriod {
  if (!period) return { start: null, end: null };
  const dates = period.match(DATE) ?? [];
  return {
    start: dates[0] ?? null,
    // 날짜가 하나뿐이면 "~현재" 처럼 끝이 열린 것으로 봅니다.
    end: dates[1] ?? null,
  };
}

/** YYYY-MM-DD 문자열은 사전순 비교가 곧 날짜 비교입니다. */
export function isActiveOn(doc: KnowledgeDocument, isoDate: string): boolean {
  const { start, end } = parsePeriod(doc.period);
  if (start && isoDate < start) return false;
  if (end && isoDate > end) return false;
  return true;
}

/** 상태가 "적용 종료"로 명시된 문서 */
export function isRetired(doc: KnowledgeDocument): boolean {
  return doc.status === "적용 종료";
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
