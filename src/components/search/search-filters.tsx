"use client";

import { Button } from "@/components/ui/button";
import { KNOWLEDGE_SUMMARIES } from "@/lib/knowledge";
import type { PeriodMode, SearchFilters } from "@/lib/search-types";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: Array<{ mode: PeriodMode; label: string; hint: string }> = [
  { mode: "all", label: "전체", hint: "적용 기간을 따지지 않습니다" },
  { mode: "current", label: "현재 적용 중", hint: "적용 종료된 문서를 제외합니다" },
  { mode: "date", label: "날짜 지정", hint: "그 날짜에 적용 중이던 문서만" },
];

/**
 * 검색 대상을 좁히는 필터.
 * DESIGN.md > button-pill-tab / button-pill-tab-active 를 선택 상태에 씁니다.
 */
export function SearchFiltersPanel({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
}) {
  const allSelected = filters.fileNames.length === 0;

  function toggleFile(fileName: string) {
    // 빈 배열은 "전체"를 뜻하므로, 처음 해제할 때는 전체 목록에서 하나를 뺍니다.
    const current = allSelected
      ? KNOWLEDGE_SUMMARIES.map((doc) => doc.fileName)
      : filters.fileNames;

    const next = current.includes(fileName)
      ? current.filter((name) => name !== fileName)
      : [...current, fileName];

    onChange({
      ...filters,
      fileNames: next.length === KNOWLEDGE_SUMMARIES.length ? [] : next,
    });
  }

  const isChecked = (fileName: string) =>
    allSelected || filters.fileNames.includes(fileName);

  return (
    <div className="flex flex-col gap-lg rounded-xl border border-hairline-soft bg-canvas p-xl">
      <div className="flex flex-col gap-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-xs">
          <span className="text-body-sm font-bold text-ink">검색할 문서</span>
          <Button
            type="button"
            variant="ghost"
            size="pill"
            onClick={() => onChange({ ...filters, fileNames: [] })}
            disabled={allSelected}
          >
            전체 선택
          </Button>
        </div>

        <div className="flex flex-wrap gap-xs">
          {KNOWLEDGE_SUMMARIES.map((doc) => {
            const checked = isChecked(doc.fileName);
            return (
              <button
                key={doc.fileName}
                type="button"
                onClick={() => toggleFile(doc.fileName)}
                aria-pressed={checked}
                title={`${doc.period ?? "적용 기간 미상"}${doc.status ? ` · ${doc.status}` : ""}`}
                className={cn(
                  "rounded-pill px-base py-xs text-body-sm font-bold transition-colors duration-200 ease-out",
                  checked
                    ? "bg-ink-deep text-canvas"
                    : "border border-hairline bg-canvas text-stone active:bg-surface-soft",
                )}
              >
                {doc.title}
                {doc.version && (
                  <span className="ml-xxs font-normal opacity-70">v{doc.version}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-xs">
        <span className="text-body-sm font-bold text-ink">적용 기간</span>

        <div className="flex flex-wrap items-center gap-xs">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.mode}
              type="button"
              variant={filters.periodMode === option.mode ? "pillTabActive" : "pillTab"}
              size="pill"
              title={option.hint}
              onClick={() =>
                onChange({
                  ...filters,
                  periodMode: option.mode,
                  asOf:
                    option.mode === "date"
                      ? (filters.asOf ?? new Date().toISOString().slice(0, 10))
                      : null,
                })
              }
            >
              {option.label}
            </Button>
          ))}

          {filters.periodMode === "date" && (
            <>
              <label htmlFor="as-of" className="sr-only">
                기준 날짜
              </label>
              <input
                id="as-of"
                type="date"
                value={filters.asOf ?? ""}
                onChange={(event) =>
                  onChange({ ...filters, asOf: event.target.value || null })
                }
                className="h-[40px] rounded-lg border border-hairline bg-canvas px-md text-body-sm text-ink outline-none focus:border-2 focus:border-fb-blue focus:px-[11px]"
              />
            </>
          )}
        </div>

        <p className="text-caption text-stone">
          {PERIOD_OPTIONS.find((o) => o.mode === filters.periodMode)?.hint}
        </p>
      </div>
    </div>
  );
}
