"use client";

import { FileText } from "lucide-react";

import { Highlight } from "@/components/search/highlight";
import type { SearchHit } from "@/lib/search-types";

/**
 * 검색기 하나의 결과 목록.
 * DESIGN.md > card-icon-feature 크롬(canvas + rounded.xl + hairline-soft)을 따릅니다.
 */
export function ResultColumn({
  title,
  subtitle,
  scoreLabel,
  scoreDigits,
  hits,
  terms,
  isLoading,
}: {
  title: string;
  subtitle: string;
  scoreLabel: string;
  scoreDigits: number;
  hits: SearchHit[];
  terms: string[];
  isLoading: boolean;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-hairline-soft bg-canvas">
      <div className="border-b border-hairline-soft px-base py-md">
        <h2 className="text-subtitle-lg font-bold text-ink-deep">{title}</h2>
        <p className="mt-xxs text-caption text-stone">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-md p-base">
        {isLoading && <p className="text-body-sm text-stone">검색 중…</p>}

        {!isLoading && hits.length === 0 && (
          <p className="text-body-sm text-stone">결과가 없습니다.</p>
        )}

        {!isLoading &&
          hits.map((hit) => (
            <article
              key={hit.chunk.id}
              className="rounded-lg border border-hairline-soft p-md"
            >
              <div className="flex flex-wrap items-center gap-x-xs gap-y-xxs">
                <span className="inline-flex size-[20px] items-center justify-center rounded-full bg-ink-deep text-caption font-bold text-canvas">
                  {hit.rank}
                </span>
                <span className="inline-flex min-w-0 items-center gap-xxs text-caption text-steel">
                  <FileText size={12} strokeWidth={2} aria-hidden className="shrink-0" />
                  <span className="truncate" title={hit.chunk.fileName}>
                    {hit.chunk.fileName}
                  </span>
                </span>
                <span className="ml-auto shrink-0 text-caption font-bold tabular-nums text-ink">
                  {scoreLabel} {hit.score.toFixed(scoreDigits)}
                </span>
              </div>

              <p className="mt-xs truncate text-body-sm font-bold text-ink-deep">
                조각 #{hit.chunk.index} · {hit.chunk.title ?? "(제목 없음)"}
              </p>

              {hit.ranks && (
                <p className="mt-xxs flex flex-wrap gap-xxs text-caption text-stone">
                  {Object.entries(hit.ranks).map(([source, rank]) => (
                    <span
                      key={source}
                      className="rounded-pill bg-surface-soft px-xs py-[1px] font-bold text-steel"
                    >
                      {source} {rank}위
                    </span>
                  ))}
                </p>
              )}

              <p className="mt-xs line-clamp-6 whitespace-pre-wrap break-words text-caption leading-[1.6] text-charcoal">
                <Highlight text={hit.chunk.text} terms={terms} />
              </p>
            </article>
          ))}
      </div>
    </section>
  );
}
