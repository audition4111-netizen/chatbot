"use client";

import { Check, Filter, X } from "lucide-react";

import type { SearchScope } from "@/lib/search-types";

const MODE_LABEL: Record<SearchScope["periodMode"], string> = {
  all: "적용 기간 전체",
  current: "현재 적용 중",
  date: "지정 날짜 기준",
};

/**
 * 이번 검색이 실제로 어떤 범위에서 이뤄졌는지 결과 옆에 붙입니다.
 * 요청한 필터가 아니라 서버가 적용한 결과를 그대로 보여주므로,
 * 왜 어떤 문서가 빠졌는지까지 확인할 수 있습니다.
 */
export function ScopeSummary({ scope }: { scope: SearchScope }) {
  const included = scope.documents.filter((doc) => doc.included);
  const excluded = scope.documents.filter((doc) => !doc.included);

  return (
    <aside className="flex flex-col gap-md rounded-xl border border-hairline-soft bg-canvas p-base">
      <div className="flex items-center gap-xs">
        <Filter size={16} strokeWidth={2} className="shrink-0 text-steel" aria-hidden />
        <h2 className="text-subtitle-lg font-bold text-ink-deep">검색 범위</h2>
      </div>

      <p className="text-body-sm text-charcoal">
        문서{" "}
        <span className="font-bold text-ink-deep">
          {scope.includedDocuments}/{scope.totalDocuments}건
        </span>{" "}
        · 조각{" "}
        <span className="font-bold text-ink-deep">
          {scope.chunkCount}/{scope.totalChunkCount}개
        </span>
      </p>

      <p className="text-caption text-stone">
        {MODE_LABEL[scope.periodMode]}
        {scope.asOf && ` · 기준일 ${scope.asOf}`}
      </p>

      {scope.chunkCount === 0 && (
        <p role="alert" className="text-body-sm text-critical-strong">
          조건에 맞는 문서가 없어 검색하지 않았습니다. 필터를 넓혀 주세요.
        </p>
      )}

      <ul className="flex flex-col gap-xs">
        {included.map((doc) => (
          <li key={doc.fileName} className="flex items-start gap-xs">
            <Check
              size={14}
              strokeWidth={2.5}
              className="mt-[3px] shrink-0 text-success"
              aria-hidden
            />
            <span className="min-w-0 text-body-sm text-ink">
              {doc.title}
              {doc.version && (
                <span className="ml-xxs text-caption text-stone">v{doc.version}</span>
              )}
              <span className="ml-xxs text-caption text-stone">
                조각 {doc.chunkCount}개
              </span>
            </span>
          </li>
        ))}

        {excluded.map((doc) => (
          <li key={doc.fileName} className="flex items-start gap-xs">
            <X
              size={14}
              strokeWidth={2.5}
              className="mt-[3px] shrink-0 text-stone"
              aria-hidden
            />
            <span className="min-w-0 text-body-sm text-stone">
              <span className="line-through">{doc.title}</span>
              <span className="ml-xxs text-caption">{doc.excludedReason}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
