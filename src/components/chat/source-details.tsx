"use client";

import { ChevronRight } from "lucide-react";

import { formatChars, type SourceFile } from "@/lib/attachments";

/**
 * 이번 질문과 함께 실제로 전달된 자료를 펼쳐서 확인하는 영역.
 * 여기 보이는 본문은 모델에 전달된 텍스트와 정확히 동일합니다
 * (상한 적용은 전송 메시지를 만들 때 한 번만 이뤄집니다).
 */
export function SourceDetails({ files }: { files: SourceFile[] }) {
  if (files.length === 0) return null;

  const totalChars = files.reduce((sum, file) => sum + file.text.length, 0);

  return (
    <details className="group w-full rounded-lg border border-hairline-soft bg-canvas">
      <summary className="flex cursor-pointer list-none items-center gap-xs px-md py-xs text-body-sm text-steel">
        <ChevronRight
          size={16}
          strokeWidth={2}
          aria-hidden
          className="shrink-0 transition-transform duration-200 ease-out group-open:rotate-90"
        />
        <span className="font-bold text-ink">이번 질문에 전달한 자료</span>
        <span className="text-stone">
          파일 {files.length}개 · {formatChars(totalChars)}
        </span>
      </summary>

      <div className="flex flex-col gap-base border-t border-hairline-soft p-md">
        {files.map((file) => (
          <div key={file.name} className="flex flex-col gap-xs">
            <div className="flex flex-wrap items-center gap-xs">
              <span className="text-body-sm font-bold text-ink">{file.name}</span>
              <span className="text-caption text-stone">
                {formatChars(file.text.length)}
              </span>
              {file.truncated && (
                <span className="rounded-pill bg-warning px-xs py-[2px] text-caption font-bold text-ink-deep">
                  일부만 전달됨
                </span>
              )}
            </div>
            <pre className="max-h-[240px] overflow-auto rounded-md bg-surface-soft p-md text-caption leading-[1.6] whitespace-pre-wrap break-words text-charcoal">
              {file.text}
            </pre>
          </div>
        ))}
      </div>
    </details>
  );
}
