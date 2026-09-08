"use client";

import { ChevronRight, FileText } from "lucide-react";

import type { PipelineId, PipelineResult, Verdict } from "@/lib/eval-types";
import { cn } from "@/lib/utils";

const VERDICT_STYLE: Record<"pass" | "fail", string> = {
  pass: "bg-success text-canvas",
  fail: "bg-critical text-canvas",
};

/**
 * 파이프라인 하나의 결과. 답변·출처·시간을 위에 두고,
 * 검색 원문은 접어 둡니다 (조각이 길어 화면을 밀어냅니다).
 */
export function PipelineColumn({
  label,
  description,
  result,
  verdict,
  onVerdict,
}: {
  label: string;
  description: string;
  result: PipelineResult;
  verdict: Verdict;
  onVerdict: (next: Verdict) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-hairline-soft bg-canvas">
      <div className="flex items-start justify-between gap-xs border-b border-hairline-soft px-base py-md">
        <div className="min-w-0">
          <h3 className="text-body-md font-bold text-ink-deep">{label}</h3>
          <p className="mt-xxs text-caption text-stone">{description}</p>
        </div>
        <span className="shrink-0 text-caption tabular-nums text-steel">
          {Math.round(result.totalMs).toLocaleString("ko-KR")}ms
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-md p-base">
        <p className="whitespace-pre-wrap break-words text-body-sm leading-[1.6] text-ink">
          {result.answer}
        </p>

        <div className="flex flex-wrap gap-xxs">
          {result.sourceFiles.map((file) => (
            <span
              key={file}
              className="inline-flex items-center gap-xxs rounded-pill border border-hairline bg-canvas px-xs py-[2px] text-caption text-steel"
            >
              <FileText size={11} strokeWidth={2} aria-hidden />
              {file}
            </span>
          ))}
        </div>

        <p className="text-caption tabular-nums text-stone">
          검색 {Math.round(result.retrievalMs).toLocaleString("ko-KR")}ms · 생성{" "}
          {Math.round(result.answerMs).toLocaleString("ko-KR")}ms
        </p>

        <details className="group rounded-lg border border-hairline-soft">
          <summary className="flex cursor-pointer list-none items-center gap-xs px-md py-xs text-caption text-steel">
            <ChevronRight
              size={14}
              strokeWidth={2}
              aria-hidden
              className="shrink-0 transition-transform duration-200 ease-out group-open:rotate-90"
            />
            검색 원문 {result.chunks.length}개
          </summary>
          <div className="flex flex-col gap-md border-t border-hairline-soft p-md">
            {result.chunks.map((item, index) => (
              <div key={item.chunk.id} className="flex flex-col gap-xxs">
                <p className="text-caption font-bold text-ink">
                  {index + 1}. {item.chunk.fileName} · 조각 #{item.chunk.index}
                  <span className="ml-xxs font-normal text-stone">
                    {result.id === "rerank"
                      ? `점수 ${item.score.toFixed(1)}${item.previousRank ? ` · 이전 ${item.previousRank}위` : ""}`
                      : `점수 ${item.score.toFixed(3)}`}
                  </span>
                </p>
                {item.reason && (
                  <p className="text-caption text-steel">{item.reason}</p>
                )}
                <pre className="max-h-[160px] overflow-auto rounded-md bg-surface-soft p-xs text-caption leading-[1.6] whitespace-pre-wrap break-words text-charcoal">
                  {item.chunk.text}
                </pre>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="flex items-center gap-xs border-t border-hairline-soft px-base py-md">
        <span className="text-caption text-stone">채점</span>
        {(["pass", "fail"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={verdict === value}
            onClick={() => onVerdict(verdict === value ? null : value)}
            className={cn(
              "rounded-pill px-md py-[4px] text-caption font-bold transition-colors duration-200 ease-out",
              verdict === value
                ? VERDICT_STYLE[value]
                : "border border-hairline bg-canvas text-steel active:bg-surface-soft",
            )}
          >
            {value === "pass" ? "정답" : "오답"}
          </button>
        ))}
      </div>
    </section>
  );
}

export type { PipelineId };
