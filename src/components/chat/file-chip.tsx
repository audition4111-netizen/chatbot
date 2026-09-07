"use client";

import { FileText, X } from "lucide-react";

import { formatBytes } from "@/lib/attachments";

/**
 * DESIGN.md > button-pill-tab 크롬을 따른 첨부 파일 칩.
 * canvas 배경 + 1px hairline + rounded.full, 라벨은 body-sm-bold.
 * 제거 버튼은 칩 안의 원형 히트 영역입니다.
 */
export function FileChip({
  name,
  bytes,
  onRemove,
}: {
  name: string;
  bytes: number;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-[260px] items-center gap-xs rounded-pill border border-hairline bg-canvas py-xs pl-md pr-xxs text-body-sm font-bold text-ink">
      <FileText size={14} strokeWidth={2} className="shrink-0 text-steel" aria-hidden />
      <span className="truncate" title={name}>
        {name}
      </span>
      <span className="shrink-0 font-normal text-stone">{formatBytes(bytes)}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${name} 첨부 제거`}
        title="첨부 제거"
        className="flex size-[24px] shrink-0 items-center justify-center rounded-full text-steel active:bg-surface-soft"
      >
        <X size={14} strokeWidth={2.5} aria-hidden />
      </button>
    </span>
  );
}
