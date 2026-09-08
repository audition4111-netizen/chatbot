"use client";

import { CheckCircle2, Lock } from "lucide-react";

import type { GoldStandard } from "@/lib/eval-types";

/**
 * 정답과 필요한 근거.
 * 이 컴포넌트는 실행이 끝난 뒤에만 렌더링되며, 정답 데이터는 서버가
 * 답변 생성을 마친 다음에야 응답에 실어 보냅니다.
 * 검색 코퍼스와 답변 프롬프트에는 들어가지 않습니다.
 */
export function GoldPanel({ gold }: { gold: GoldStandard }) {
  return (
    <div className="rounded-xl border border-hairline-soft bg-surface-soft p-base">
      <div className="flex items-center gap-xs">
        <CheckCircle2 size={16} strokeWidth={2} className="text-success" aria-hidden />
        <h3 className="text-body-sm font-bold text-ink-deep">정답과 필요한 근거</h3>
        <span className="ml-auto inline-flex items-center gap-xxs text-caption text-stone">
          <Lock size={11} strokeWidth={2} aria-hidden />
          검색·생성에는 제공되지 않음
        </span>
      </div>

      <p className="mt-xs text-body-sm leading-[1.6] text-ink">{gold.expected}</p>

      <div className="mt-md flex flex-col gap-xxs text-caption">
        <p className="text-steel">
          <span className="font-bold text-ink">필요한 근거</span>{" "}
          {gold.requiredFiles.join(", ")}
        </p>
        {gold.forbiddenFiles.length > 0 && (
          <p className="text-steel">
            <span className="font-bold text-critical-strong">근거로 쓰면 안 되는 문서</span>{" "}
            {gold.forbiddenFiles.join(", ")}
          </p>
        )}
        {gold.mustInclude.length > 0 && (
          <p className="text-steel">
            <span className="font-bold text-ink">답에 들어가야 할 표현</span>{" "}
            {gold.mustInclude.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
