"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Paperclip, Upload } from "lucide-react";

import { ChunkCard } from "@/components/chunks/chunk-card";
import { ChunkControls } from "@/components/chunks/chunk-controls";
import { SourceView } from "@/components/chunks/source-view";
import { FileChip } from "@/components/chat/file-chip";
import { Button } from "@/components/ui/button";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILES,
  readAttachments,
  type Attachment,
} from "@/lib/attachments";
import {
  DEFAULT_CHUNK_OPTIONS,
  chunkDocument,
  type ChunkOptions,
  type DocumentChunk,
} from "@/lib/chunking";
import { cn } from "@/lib/utils";

/** 한 번에 그리는 조각 수 상한 (아주 긴 문서에서 화면이 멈추지 않도록) */
const RENDER_LIMIT = 200;

export function ChunkWorkbench() {
  const [files, setFiles] = React.useState<Attachment[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [options, setOptions] = React.useState<ChunkOptions>(DEFAULT_CHUNK_OPTIONS);
  const [selectedChunkId, setSelectedChunkId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragDepth = React.useRef(0);

  const active = files.find((file) => file.id === activeId) ?? files[0] ?? null;

  const chunks: DocumentChunk[] = React.useMemo(
    () => (active ? chunkDocument(active.name, active.text, options) : []),
    [active, options],
  );

  // 설정이나 문서가 바뀌면 선택을 초기화합니다.
  React.useEffect(() => {
    setSelectedChunkId(null);
  }, [active?.id, options.maxChars, options.overlapChars]);

  const selected = chunks.find((chunk) => chunk.id === selectedChunkId) ?? null;

  const intake = React.useCallback(
    async (list: FileList | null) => {
      const result = await readAttachments(list, files.length);
      if (result.accepted.length > 0) {
        setFiles((prev) => [...prev, ...result.accepted]);
        setActiveId((prev) => prev ?? result.accepted[0].id);
      }
      setErrors(result.errors);
    },
    [files.length],
  );

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }

  return (
    <div
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setIsDragging(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current = 0;
        setIsDragging(false);
        void intake(event.dataTransfer.files);
      }}
      className="flex min-h-dvh flex-col bg-canvas"
    >
      <header className="sticky top-0 z-10 w-full border-b border-hairline-soft bg-canvas">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-base px-xl md:px-xxl">
          <span className="text-subtitle-lg font-bold tracking-[-0.16px] text-ink-deep">
            문서 조각 보기
          </span>
          <div className="flex items-center gap-xs">
            <Button asChild variant="pillTab" size="pill">
              <Link href="/search">검색 비교</Link>
            </Button>
            <Button asChild variant="ghost" size="ghost">
              <Link href="/">
                <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
                챗봇으로
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-xl px-xl py-xxl md:px-xxl">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          multiple
          className="hidden"
          onChange={(event) => {
            void intake(event.target.files);
            event.target.value = "";
          }}
        />

        {files.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-base rounded-xxl border-2 border-dashed border-hairline px-xl py-section text-center",
              isDragging && "border-fb-blue bg-surface-soft",
            )}
          >
            <Upload size={28} strokeWidth={1.5} className="text-steel" aria-hidden />
            <p className="text-heading-sm text-ink-deep">TXT·MD 문서를 올려주세요</p>
            <p className="max-w-[420px] text-body-sm text-slate">
              여기에 끌어다 놓거나 아래 버튼으로 선택하면, 문단을 고려해 나눈 결과를
              보여드립니다. 답변은 만들지 않습니다.
            </p>
            <Button type="button" onClick={() => inputRef.current?.click()}>
              <Paperclip size={16} strokeWidth={2.5} aria-hidden />
              파일 선택
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-xs">
              {files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveId(file.id)}
                  className={cn(
                    "rounded-pill px-base py-xs text-body-sm font-bold transition-colors duration-200 ease-out",
                    file.id === active?.id
                      ? "bg-ink-deep text-canvas"
                      : "border border-hairline bg-canvas text-ink active:bg-surface-soft",
                  )}
                >
                  {file.name}
                </button>
              ))}
              {files.length < MAX_FILES && (
                <Button
                  type="button"
                  variant="ghost"
                  size="pill"
                  onClick={() => inputRef.current?.click()}
                >
                  <Paperclip size={14} strokeWidth={2.5} aria-hidden />
                  파일 추가
                </Button>
              )}
            </div>

            <ul className="flex flex-wrap gap-xs">
              {files.map((file) => (
                <li key={file.id}>
                  <FileChip
                    name={file.name}
                    bytes={file.bytes}
                    onRemove={() => removeFile(file.id)}
                  />
                </li>
              ))}
            </ul>

            <ChunkControls options={options} onChange={setOptions} />

            {active && (
              <div className="grid gap-xl lg:grid-cols-2">
                <Panel
                  title="원문"
                  meta={`${active.name} · ${active.text.length.toLocaleString("ko-KR")}자`}
                >
                  <SourceView source={active.text} selected={selected} />
                </Panel>

                <Panel
                  title="나뉜 조각"
                  meta={
                    chunks.length > RENDER_LIMIT
                      ? `총 ${chunks.length.toLocaleString("ko-KR")}개 중 ${RENDER_LIMIT}개 표시`
                      : `${chunks.length.toLocaleString("ko-KR")}개`
                  }
                >
                  <div className="flex flex-col gap-md">
                    {chunks.slice(0, RENDER_LIMIT).map((chunk) => (
                      <ChunkCard
                        key={chunk.id}
                        chunk={chunk}
                        isSelected={chunk.id === selectedChunkId}
                        onSelect={() =>
                          setSelectedChunkId((prev) =>
                            prev === chunk.id ? null : chunk.id,
                          )
                        }
                      />
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </>
        )}

        {errors.length > 0 && (
          <p role="alert" className="text-body-sm text-critical-strong">
            {errors.join(" / ")}
          </p>
        )}

        {files.length > 0 && (
          <p className="text-caption text-stone">
            조각을 누르면 왼쪽 원문에서 해당 구간이 강조됩니다. 점선 밑줄 구간은 앞
            조각과 겹치는 부분입니다.
          </p>
        )}
      </main>

      {isDragging && files.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center bg-[rgba(10,19,23,0.12)]">
          <span className="rounded-pill bg-ink-deep px-xl py-md text-body-sm font-bold text-canvas">
            여기에 놓으면 문서가 추가됩니다
          </span>
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-hairline-soft bg-canvas">
      <div className="flex items-baseline justify-between gap-xs border-b border-hairline-soft px-base py-md">
        <h2 className="text-subtitle-lg font-bold text-ink-deep">{title}</h2>
        <span className="truncate text-caption text-stone">{meta}</span>
      </div>
      <div className="max-h-[70vh] min-h-[240px] overflow-auto p-base">{children}</div>
    </section>
  );
}
