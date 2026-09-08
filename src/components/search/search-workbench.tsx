"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { ResultColumn } from "@/components/search/result-column";
import { ScopeSummary } from "@/components/search/scope-summary";
import { SearchFiltersPanel } from "@/components/search/search-filters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_FILTERS,
  MAX_TOP_K,
  type SearchFilters,
  type SearchResponse,
} from "@/lib/search-types";

const EXAMPLES = [
  "APP-017",
  "숙박비는 얼마까지 되나요?",
  "교육비 지원 한도",
  "회의실 예약",
];

export function SearchWorkbench() {
  const [query, setQuery] = React.useState("");
  const [topK, setTopK] = React.useState(5);
  const [filters, setFilters] = React.useState<SearchFilters>(DEFAULT_FILTERS);
  const [result, setResult] = React.useState<SearchResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const requestId = React.useRef(0);

  const run = React.useCallback(
    async (text: string, k: number, activeFilters: SearchFilters) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) return;

      const id = ++requestId.current;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, topK: k, filters: activeFilters }),
        });
        const data = (await response.json()) as SearchResponse & { error?: string };
        // 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 합니다.
        if (id !== requestId.current) return;
        if (data.error) setError(data.error);
        else setResult(data);
      } catch {
        if (id === requestId.current) setError("검색 요청에 실패했습니다.");
      } finally {
        if (id === requestId.current) setIsLoading(false);
      }
    },
    [],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    void run(query, topK, filters);
  }

  const terms = result?.queryTokens ?? [];

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-10 w-full border-b border-hairline-soft bg-canvas">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-base px-xl md:px-xxl">
          <span className="text-subtitle-lg font-bold tracking-[-0.16px] text-ink-deep">
            검색 비교
          </span>
          <div className="flex items-center gap-xs">
            <Button asChild variant="pillTab" size="pill">
              <Link href="/chunks">문서 조각 보기</Link>
            </Button>
            <Button asChild variant="pillTab" size="pill">
              <Link href="/eval">검색 평가</Link>
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(query, topK, filters);
          }}
          className="flex flex-col gap-md"
        >
          <div className="flex items-end gap-xs">
            <label htmlFor="search-query" className="sr-only">
              검색어
            </label>
            <Textarea
              id="search-query"
              rows={1}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="가온서비스 문서에서 검색합니다. 예: APP-017, 숙박비는 얼마까지 되나요?"
              className="min-h-[44px]"
            />
            <Button type="submit" disabled={query.trim().length === 0 || isLoading}>
              <Search size={16} strokeWidth={3} aria-hidden />
              검색
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-xs">
            {EXAMPLES.map((example) => (
              <Button
                key={example}
                type="button"
                variant="pillTab"
                size="pill"
                onClick={() => {
                  setQuery(example);
                  void run(example, topK, filters);
                }}
              >
                {example}
              </Button>
            ))}
          </div>

          <div className="flex max-w-[360px] flex-col gap-xxs">
            <div className="flex items-baseline justify-between">
              <label htmlFor="top-k" className="text-body-sm font-bold text-ink">
                가져올 개수
              </label>
              <span className="text-body-sm font-bold tabular-nums text-ink-deep">
                {topK}건
              </span>
            </div>
            <input
              id="top-k"
              type="range"
              min={1}
              max={MAX_TOP_K}
              step={1}
              value={topK}
              onChange={(event) => {
                const next = Number(event.target.value);
                setTopK(next);
                if (result) void run(result.query, next, filters);
              }}
              className="h-[4px] w-full cursor-pointer appearance-none rounded-pill bg-hairline accent-fb-blue"
            />
          </div>
        </form>

        <SearchFiltersPanel
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            // 필터를 바꾸면 같은 질의로 즉시 다시 검색해 범위 변화를 바로 봅니다.
            if (result) void run(result.query, topK, next);
          }}
        />

        {error && (
          <p role="alert" className="text-body-sm text-critical-strong">
            {error}
          </p>
        )}

        {result && (
          <div className="flex flex-col gap-xxs rounded-lg border border-hairline-soft bg-canvas p-md">
            <p className="text-body-sm font-bold text-ink">
              질의 토큰{" "}
              <span className="font-normal text-stone">
                조사를 뗀 어간과 2글자 조합으로 나눕니다
              </span>
            </p>
            <p className="flex flex-wrap gap-xxs">
              {result.queryTokens.map((token) => (
                <span
                  key={token}
                  className="rounded-pill bg-surface-soft px-xs py-[2px] text-caption text-steel"
                >
                  {token}
                </span>
              ))}
            </p>
            <p className="mt-xxs text-caption text-stone">
              검색 대상 조각 {result.chunkCount}개 · 키워드{" "}
              {result.timings.keyword.toFixed(1)}ms · 벡터{" "}
              {result.timings.vector.toFixed(0)}ms · 결합{" "}
              {result.timings.hybrid.toFixed(1)}ms
            </p>
          </div>
        )}

        {(result || isLoading) && (
          <div className="grid gap-xl xl:grid-cols-[260px_minmax(0,1fr)]">
            {result && (
              <div className="xl:sticky xl:top-[88px] xl:self-start">
                <ScopeSummary scope={result.scope} />
              </div>
            )}

            <div className="grid gap-xl lg:grid-cols-3">
            <ResultColumn
              title="키워드 (BM25)"
              subtitle="글자가 그대로 겹치는 조각. 오류 코드에 강합니다"
              scoreLabel="BM25"
              scoreDigits={2}
              hits={result?.keyword ?? []}
              terms={terms}
              isLoading={isLoading}
            />
            <ResultColumn
              title="벡터"
              subtitle="text-embedding-3-small 코사인 유사도. 표현이 달라도 찾습니다"
              scoreLabel="유사도"
              scoreDigits={3}
              hits={result?.vector ?? []}
              terms={terms}
              isLoading={isLoading}
            />
            <ResultColumn
              title="하이브리드 (RRF)"
              subtitle="두 순위를 1/(60+순위)로 합산. 같은 조각은 한 번만"
              scoreLabel="RRF"
              scoreDigits={4}
              hits={result?.hybrid ?? []}
              terms={terms}
              isLoading={isLoading}
            />
            </div>
          </div>
        )}

        {!result && !isLoading && !error && (
          <p className="text-body-sm text-slate">
            검색어를 입력하면 키워드·벡터·하이브리드 결과를 나란히 보여줍니다.
            아직 답변은 만들지 않고 어떤 조각이 검색되는지만 확인합니다.
          </p>
        )}
      </main>
    </div>
  );
}
