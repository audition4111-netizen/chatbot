"use client";

import * as React from "react";

import type { DocumentChunk } from "@/lib/chunking";

/**
 * 원문 패널. 선택한 조각의 구간을 원문 위에 그대로 표시합니다.
 * 조각은 언제나 원문의 연속 구간이므로 slice 세 조각으로 나눠 칠하면 됩니다.
 * 강조 색은 DESIGN.md가 정보 콜아웃용으로 지정한 soft cobalt 15% 틴트입니다.
 */
export function SourceView({
  source,
  selected,
}: {
  source: string;
  selected: DocumentChunk | null;
}) {
  const markRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    markRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected]);

  if (!selected) {
    return (
      <pre className="whitespace-pre-wrap break-words text-body-sm leading-[1.7] text-charcoal">
        {source}
      </pre>
    );
  }

  const overlapEnd = selected.coreStart;

  return (
    <pre className="whitespace-pre-wrap break-words text-body-sm leading-[1.7] text-charcoal">
      {source.slice(0, selected.start)}
      <mark
        ref={markRef}
        className="bg-[rgba(0,145,255,0.15)] text-ink-deep"
        title={`조각 #${selected.index}`}
      >
        {overlapEnd > selected.start && (
          <span className="bg-[rgba(0,145,255,0.18)] underline decoration-stone decoration-dotted underline-offset-2">
            {source.slice(selected.start, overlapEnd)}
          </span>
        )}
        {source.slice(overlapEnd, selected.end)}
      </mark>
      {source.slice(selected.end)}
    </pre>
  );
}
