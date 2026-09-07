"use client";

import * as React from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";

import { FileChip } from "@/components/chat/file-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILES,
  MAX_FILE_BYTES,
  formatBytes,
  hasAcceptedExtension,
  type Attachment,
} from "@/lib/attachments";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md > Inputs & Forms > text-input (rounded.lg, hairline 보더, 44px 기준 높이)
 * 드래그 중에는 text-input-focused 와 같은 활성 색(fb-blue)으로 테두리를 바꿉니다.
 * 전송 버튼은 button-primary(검정 필). 코발트는 구매 플로우 전용이라 쓰지 않습니다.
 */
export function ChatComposer({
  attachments,
  onAttach,
  onRemoveAttachment,
  onSubmit,
  onStop,
  isBusy,
}: {
  attachments: Attachment[];
  onAttach: (files: Attachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  onSubmit: (text: string) => void;
  onStop: () => void;
  isBusy: boolean;
}) {
  const [value, setValue] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragDepth = React.useRef(0);

  // 입력 높이를 내용에 맞춰 늘립니다 (최소 44px = 폼 컨트롤 기준 높이).
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const addFiles = React.useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const errors: string[] = [];
      const accepted: Attachment[] = [];
      let slots = MAX_FILES - attachments.length;

      for (const file of Array.from(fileList)) {
        if (!hasAcceptedExtension(file.name)) {
          errors.push(`${file.name}: TXT·MD 파일만 첨부할 수 있습니다`);
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          errors.push(
            `${file.name}: 파일이 너무 큽니다 (${formatBytes(file.size)} / 최대 ${formatBytes(MAX_FILE_BYTES)})`,
          );
          continue;
        }
        if (slots <= 0) {
          errors.push(`${file.name}: 최대 ${MAX_FILES}개까지 첨부할 수 있습니다`);
          continue;
        }
        try {
          const text = await file.text();
          if (text.trim().length === 0) {
            errors.push(`${file.name}: 내용이 비어 있습니다`);
            continue;
          }
          accepted.push({
            id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
            name: file.name,
            bytes: file.size,
            text,
          });
          slots -= 1;
        } catch {
          errors.push(`${file.name}: 파일을 읽지 못했습니다`);
        }
      }

      if (accepted.length > 0) onAttach(accepted);
      setFileError(errors.length > 0 ? errors.join(" / ") : null);
    },
    [attachments.length, onAttach],
  );

  function send() {
    const text = value.trim();
    if (!text || isBusy) return;
    onSubmit(text);
    setValue("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter 전송, Shift+Enter 줄바꿈. 한글 조합 중(IME)에는 전송하지 않습니다.
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
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
        void addFiles(event.dataTransfer.files);
      }}
      className={cn(
        "rounded-xl border border-transparent p-xs transition-colors duration-200 ease-out",
        isDragging && "border-2 border-fb-blue bg-surface-soft p-[7px]",
      )}
    >
      {attachments.length > 0 && (
        <ul className="mb-xs flex flex-wrap gap-xs">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <FileChip
                name={attachment.name}
                bytes={attachment.bytes}
                onRemove={() => onRemoveAttachment(attachment.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex items-end gap-xs"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          multiple
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <Button
          type="button"
          variant="iconCircular"
          size="icon"
          onClick={() => inputRef.current?.click()}
          aria-label="TXT 또는 MD 파일 첨부"
          title="TXT 또는 MD 파일 첨부"
          className="mb-[2px] border border-hairline"
        >
          <Paperclip size={18} strokeWidth={2} aria-hidden />
        </Button>

        <label htmlFor="chat-input" className="sr-only">
          메시지 입력
        </label>
        <Textarea
          id="chat-input"
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDragging
              ? "여기에 놓으면 첨부됩니다"
              : "무엇이든 물어보세요. TXT·MD 파일을 끌어다 놓을 수 있습니다"
          }
          className="min-h-[44px]"
        />

        {isBusy ? (
          <Button
            type="button"
            variant="secondary"
            size="secondary"
            onClick={onStop}
            className="mb-[2px] h-[44px] shrink-0"
          >
            <Square size={14} strokeWidth={3} aria-hidden />
            중지
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="primary"
            disabled={value.trim().length === 0}
            className="mb-[2px] h-[44px] shrink-0"
          >
            <ArrowUp size={16} strokeWidth={3} aria-hidden />
            전송
          </Button>
        )}
      </form>

      {fileError && (
        <p role="alert" className="mt-xs text-body-sm text-critical-strong">
          {fileError}
        </p>
      )}
    </div>
  );
}
