"use client";

import { FileText, Hash } from "lucide-react";

import type { DocumentChunk } from "@/lib/chunking";
import { cn } from "@/lib/utils";

/**
 * 조각 하나. DESIGN.md > card-icon-feature 크롬(canvas + rounded.xl + hairline-soft).
 * 선택 시 테두리를 ink-deep 2px로 바꿉니다 (DESIGN.md의 선택 타일 규칙).
 * 앞부분 겹침 구간은 surface-soft 배경으로 구분해 어디까지가 겹침인지 보이게 합니다.
 */
export function ChunkCard({
  chunk,
  isSelected,
  onSelect,
}: {
  chunk: DocumentChunk;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const overlapLength = chunk.coreStart - chunk.start;
  const overlapText = chunk.text.slice(0, overlapLength);
  const coreText = chunk.text.slice(overlapLength);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "w-full rounded-xl border bg-canvas p-base text-left transition-colors duration-200 ease-out",
        isSelected
          ? "border-2 border-ink-deep p-[15px]"
          : "border-hairline-soft active:bg-surface-soft",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-xs gap-y-xxs">
        <span className="inline-flex items-center gap-[2px] rounded-pill bg-ink-deep px-xs py-[2px] text-caption font-bold text-canvas">
          <Hash size={11} strokeWidth={2.5} aria-hidden />
          {chunk.index}
        </span>
        <span className="inline-flex min-w-0 items-center gap-xxs text-caption text-steel">
          <FileText size={12} strokeWidth={2} aria-hidden className="shrink-0" />
          <span className="truncate" title={chunk.fileName}>
            {chunk.fileName}
          </span>
        </span>
      </div>

      <p
        className="mt-xs truncate text-body-sm font-bold text-ink-deep"
        title={chunk.title ?? undefined}
      >
        {chunk.title ?? "(제목 없음)"}
      </p>

      <p className="mt-xxs text-caption text-stone">
        {chunk.text.length.toLocaleString("ko-KR")}자
        {overlapLength > 0 && ` · 겹침 ${overlapLength}자`}
        {` · 원문 ${chunk.start.toLocaleString("ko-KR")}~${chunk.end.toLocaleString("ko-KR")}`}
      </p>

      <p className="mt-xs whitespace-pre-wrap break-words text-body-sm leading-[1.6] text-charcoal">
        {overlapLength > 0 && (
          <span
            className="rounded-sm bg-surface-soft text-stone"
            title={`앞 조각과 겹치는 ${overlapLength}자`}
          >
            {overlapText}
          </span>
        )}
        {coreText}
      </p>
    </button>
  );
}
