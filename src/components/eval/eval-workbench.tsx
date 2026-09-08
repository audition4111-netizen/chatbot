"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, Play } from "lucide-react";

import { GoldPanel } from "@/components/eval/gold-panel";
import { PipelineColumn } from "@/components/eval/pipeline-column";
import { Button } from "@/components/ui/button";
import {
  PIPELINES,
  type EvalQuestionSummary,
  type EvalRunResult,
  type PipelineId,
  type Verdict,
} from "@/lib/eval-types";
import {
  downloadCsv,
  downloadJson,
  loadReviews,
  saveReviews,
  type ReviewMap,
} from "@/lib/eval-storage";
import { cn } from "@/lib/utils";

export function EvalWorkbench() {
  const [questions, setQuestions] = React.useState<EvalQuestionSummary[]>([]);
  const [results, setResults] = React.useState<Record<string, EvalRunResult>>({});
  const [reviews, setReviews] = React.useState<ReviewMap>({});
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [topK, setTopK] = React.useState(3);
  const cancelled = React.useRef(false);

  React.useEffect(() => {
    setReviews(loadReviews());
    fetch("/api/eval/questions")
      .then((response) => response.json())
      .then((data: { questions: EvalQuestionSummary[] }) =>
        setQuestions(data.questions ?? []),
      )
      .catch(() => setError("질문 목록을 불러오지 못했습니다."));
  }, []);

  const updateReview = React.useCallback(
    (questionId: string, patch: Partial<{ verdicts: Partial<Record<PipelineId, Verdict>>; note: string }>) => {
      setReviews((previous) => {
        const current = previous[questionId] ?? { verdicts: {}, note: "", updatedAt: "" };
        const next: ReviewMap = {
          ...previous,
          [questionId]: {
            verdicts: { ...current.verdicts, ...(patch.verdicts ?? {}) },
            note: patch.note ?? current.note,
            updatedAt: new Date().toISOString(),
          },
        };
        saveReviews(next);
        return next;
      });
    },
    [],
  );

  const runOne = React.useCallback(
    async (questionId: string) => {
      setRunningId(questionId);
      setError(null);
      try {
        const response = await fetch("/api/eval/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, topK }),
        });
        const data = (await response.json()) as EvalRunResult & { error?: string };
        if (data.error) setError(data.error);
        else setResults((previous) => ({ ...previous, [questionId]: data }));
      } catch {
        setError("실행에 실패했습니다.");
      } finally {
        setRunningId(null);
      }
    },
    [topK],
  );

  const runAll = React.useCallback(async () => {
    cancelled.current = false;
    setIsRunningAll(true);
    // 한 문항씩 순서대로 실행합니다. 한 번에 보내면 요청 시간 제한에 걸립니다.
    for (const question of questions) {
      if (cancelled.current) break;
      await runOne(question.id);
    }
    setIsRunningAll(false);
  }, [questions, runOne]);

  const doneCount = Object.keys(results).length;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-10 w-full border-b border-hairline-soft bg-canvas">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-base px-xl md:px-xxl">
          <span className="text-subtitle-lg font-bold tracking-[-0.16px] text-ink-deep">
            검색 평가
          </span>
          <div className="flex items-center gap-xs">
            <Button asChild variant="pillTab" size="pill">
              <Link href="/search">검색 비교</Link>
            </Button>
            <Button asChild variant="ghost" size="ghost">
              <Link href="/">
                <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
                챗봇으로
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-xl px-xl py-xxl md:px-xxl">
        <div className="flex flex-col gap-md rounded-xl border border-hairline-soft bg-canvas p-xl">
          <div className="flex flex-wrap items-center gap-md">
            <Button type="button" onClick={runAll} disabled={isRunningAll || questions.length === 0}>
              <Play size={16} strokeWidth={3} aria-hidden />
              {isRunningAll ? "실행 중…" : "전체 실행"}
            </Button>

            {isRunningAll && (
              <Button
                type="button"
                variant="secondary"
                size="secondary"
                onClick={() => {
                  cancelled.current = true;
                }}
              >
                중지
              </Button>
            )}

            <span className="text-body-sm text-charcoal">
              문항 {doneCount}/{questions.length} 완료
            </span>

            <div className="ml-auto flex items-center gap-xs">
              <Button
                type="button"
                variant="ghost"
                size="pill"
                onClick={() => downloadCsv(results, reviews)}
                disabled={doneCount === 0}
              >
                <Download size={14} strokeWidth={2.5} aria-hidden />
                CSV
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="pill"
                onClick={() => downloadJson(results, reviews)}
                disabled={doneCount === 0}
              >
                <Download size={14} strokeWidth={2.5} aria-hidden />
                JSON
              </Button>
            </div>
          </div>

          <div className="flex max-w-[320px] flex-col gap-xxs">
            <div className="flex items-baseline justify-between">
              <label htmlFor="eval-topk" className="text-body-sm font-bold text-ink">
                답변에 넘길 조각 수
              </label>
              <span className="text-body-sm font-bold tabular-nums text-ink-deep">
                {topK}개
              </span>
            </div>
            <input
              id="eval-topk"
              type="range"
              min={1}
              max={5}
              step={1}
              value={topK}
              onChange={(event) => setTopK(Number(event.target.value))}
              disabled={isRunningAll}
              className="h-[4px] w-full cursor-pointer appearance-none rounded-pill bg-hairline accent-fb-blue"
            />
          </div>

          <p className="text-caption text-stone">
            채점과 메모는 이 브라우저에 자동 저장됩니다. 다른 곳에 남기려면
            CSV나 JSON으로 내려받으세요.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-body-sm text-critical-strong">
            {error}
          </p>
        )}

        {questions.map((question) => {
          const result = results[question.id];
          const review = reviews[question.id];
          const isRunning = runningId === question.id;

          return (
            <article
              key={question.id}
              className={cn(
                "flex flex-col gap-base rounded-xl border bg-canvas p-xl",
                isRunning ? "border-fb-blue" : "border-hairline-soft",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-md">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-xs">
                    <span className="rounded-pill bg-surface-soft px-xs py-[2px] text-caption font-bold text-steel">
                      {question.id}
                    </span>
                    <span className="text-caption text-stone">{question.category}</span>
                  </p>
                  <h2 className="mt-xs text-subtitle-lg font-bold text-ink-deep">
                    {question.question}
                  </h2>
                </div>

                <Button
                  type="button"
                  variant="pillTab"
                  size="pill"
                  onClick={() => void runOne(question.id)}
                  disabled={isRunning || isRunningAll}
                >
                  {isRunning ? "실행 중…" : result ? "다시 실행" : "실행"}
                </Button>
              </div>

              {!result && !isRunning && (
                <p className="text-body-sm text-stone">
                  아직 실행하지 않았습니다. 정답은 실행이 끝난 뒤에 표시됩니다.
                </p>
              )}

              {isRunning && (
                <p className="text-body-sm text-steel">
                  세 파이프라인을 실행하고 있습니다…
                </p>
              )}

              {result && (
                <>
                  <div className="grid gap-base lg:grid-cols-3">
                    {PIPELINES.map((pipeline) => {
                      const pipelineResult = result.pipelines.find(
                        (item) => item.id === pipeline.id,
                      );
                      if (!pipelineResult) return null;
                      return (
                        <PipelineColumn
                          key={pipeline.id}
                          label={pipeline.label}
                          description={pipeline.description}
                          result={pipelineResult}
                          verdict={review?.verdicts?.[pipeline.id] ?? null}
                          onVerdict={(next) =>
                            updateReview(question.id, {
                              verdicts: { [pipeline.id]: next },
                            })
                          }
                        />
                      );
                    })}
                  </div>

                  <GoldPanel gold={result.gold} />

                  <div className="flex flex-col gap-xxs">
                    <label
                      htmlFor={`note-${question.id}`}
                      className="text-body-sm font-bold text-ink"
                    >
                      메모
                    </label>
                    <textarea
                      id={`note-${question.id}`}
                      rows={2}
                      value={review?.note ?? ""}
                      onChange={(event) =>
                        updateReview(question.id, { note: event.target.value })
                      }
                      placeholder="이 문항에서 관찰한 점을 적어두세요"
                      className="w-full resize-y rounded-lg border border-hairline bg-canvas p-md text-body-sm text-ink outline-none placeholder:text-stone focus:border-2 focus:border-fb-blue focus:p-[11px]"
                    />
                    {review?.updatedAt && (
                      <p className="text-caption text-stone">
                        저장됨 · {new Date(review.updatedAt).toLocaleString("ko-KR")}
                      </p>
                    )}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </main>
    </div>
  );
}
