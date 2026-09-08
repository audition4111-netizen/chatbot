"use client";

import { CHUNK_LIMITS, maxOverlapFor, type ChunkOptions } from "@/lib/chunking";

/**
 * 조각 크기와 겹침을 화면에서 바로 바꿉니다.
 * 겹침은 조각 크기의 절반을 넘지 못하며, 조각 길이는 겹침을 포함해
 * 언제나 "조각 크기" 이하로 유지됩니다.
 */
export function ChunkControls({
  options,
  onChange,
}: {
  options: ChunkOptions;
  onChange: (next: ChunkOptions) => void;
}) {
  const overlapMax = maxOverlapFor(options.maxChars);

  return (
    <div className="flex flex-col gap-lg rounded-xl border border-hairline-soft bg-canvas p-xl sm:flex-row sm:gap-xxl">
      <Slider
        id="chunk-size"
        label="조각 크기"
        value={options.maxChars}
        min={CHUNK_LIMITS.minChars}
        max={CHUNK_LIMITS.maxChars}
        step={CHUNK_LIMITS.charsStep}
        hint="겹침을 포함한 최대 길이"
        onChange={(maxChars) =>
          onChange({
            maxChars,
            overlapChars: Math.min(options.overlapChars, maxOverlapFor(maxChars)),
          })
        }
      />
      <Slider
        id="chunk-overlap"
        label="겹침"
        value={options.overlapChars}
        min={CHUNK_LIMITS.minOverlap}
        max={overlapMax}
        step={CHUNK_LIMITS.overlapStep}
        hint={`앞 조각 끝에서 가져옴 (최대 ${overlapMax}자)`}
        onChange={(overlapChars) => onChange({ ...options, overlapChars })}
      />
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hint: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-xs">
      <div className="flex items-baseline justify-between gap-xs">
        <label htmlFor={id} className="text-body-sm font-bold text-ink">
          {label}
        </label>
        <span className="text-body-sm font-bold tabular-nums text-ink-deep">
          {value.toLocaleString("ko-KR")}자
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-[4px] w-full cursor-pointer appearance-none rounded-pill bg-hairline accent-fb-blue"
      />
      <p className="text-caption text-stone">{hint}</p>
    </div>
  );
}
