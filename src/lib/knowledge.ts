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
