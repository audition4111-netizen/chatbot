import * as React from "react";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 질의 토큰이 본문 어디에 걸렸는지 표시합니다.
 * DESIGN.md가 정보 콜아웃용으로 지정한 soft cobalt 15% 틴트를 씁니다.
 */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const usable = terms.filter((term) => term.length >= 2);
  if (usable.length === 0) return <>{text}</>;

  // 긴 토큰이 먼저 걸려야 "숙박비"가 "숙박"보다 우선 강조됩니다.
  const pattern = [...usable]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");

  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  const lowered = new Set(usable.map((term) => term.toLowerCase()));

  return (
    <>
      {parts.map((part, index) =>
        lowered.has(part.toLowerCase()) ? (
          <mark
            key={index}
            className="rounded-xs bg-[rgba(0,145,255,0.18)] text-ink-deep"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
