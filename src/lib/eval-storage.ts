import type { EvalRunResult, PipelineId, QuestionReview } from "@/lib/eval-types";

/**
 * 채점과 메모는 브라우저에만 저장합니다.
 * 서버에 저장소가 없으므로 localStorage에 두고, 내려받기로 파일에 남깁니다.
 */
export const STORAGE_KEY = "chatbot-eval-review-v1";

export type ReviewMap = Record<string, QuestionReview>;

export function loadReviews(): ReviewMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as ReviewMap) : {};
  } catch {
    // 사생활 보호 모드나 저장소 차단 환경에서도 화면은 정상 동작해야 합니다.
    return {};
  }
}

export function saveReviews(reviews: ReviewMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // 저장에 실패해도 화면 사용은 막지 않습니다.
  }
}

function download(fileName: string, content: string, mime: string): void {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const PIPELINE_ORDER: PipelineId[] = ["vector", "hybrid", "rerank"];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function downloadCsv(
  results: Record<string, EvalRunResult>,
  reviews: ReviewMap,
): void {
  const header = [
    "문항", "분류", "질문", "파이프라인", "채점", "답변",
    "출처", "검색ms", "생성ms", "합계ms", "정답", "필요한근거", "메모",
  ];

  const rows: string[] = [header.map(csvCell).join(",")];

  for (const result of Object.values(results)) {
    const review = reviews[result.questionId];
    for (const id of PIPELINE_ORDER) {
      const pipeline = result.pipelines.find((item) => item.id === id);
      if (!pipeline) continue;
      const verdict = review?.verdicts?.[id];
      rows.push(
        [
          result.questionId,
          result.category,
          result.question,
          id,
          verdict === "pass" ? "정답" : verdict === "fail" ? "오답" : "",
          pipeline.answer,
          pipeline.sourceFiles.join(" / "),
          String(Math.round(pipeline.retrievalMs)),
          String(Math.round(pipeline.answerMs)),
          String(Math.round(pipeline.totalMs)),
          result.gold.expected,
          result.gold.requiredFiles.join(" / "),
          review?.note ?? "",
        ].map(csvCell).join(","),
      );
    }
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  download(`가온서비스-검색평가-${stamp}.csv`, rows.join("\n"), "text/csv;charset=utf-8");
}

export function downloadJson(
  results: Record<string, EvalRunResult>,
  reviews: ReviewMap,
): void {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  download(
    `가온서비스-검색평가-${stamp}.json`,
    JSON.stringify({ savedAt: new Date().toISOString(), results, reviews }, null, 2),
    "application/json;charset=utf-8",
  );
}
