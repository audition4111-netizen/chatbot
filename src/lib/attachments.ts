import type { UIMessage } from "ai";

/** 허용 확장자 — 로컬 텍스트 파일만 받습니다. */
export const ACCEPTED_EXTENSIONS = [".txt", ".md", ".markdown"] as const;
export const ACCEPT_ATTRIBUTE = ".txt,.md,.markdown,text/plain,text/markdown";

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 1024 * 1024; // 파일당 1MB
export const MAX_CHARS_PER_FILE = 20_000; // 모델에 보낼 때 파일당 상한
export const MAX_CHARS_TOTAL = 60_000; // 모델에 보낼 때 전체 상한

/** 입력창에 붙어 있는 첨부 파일 (브라우저 상태) */
export type Attachment = {
  id: string;
  name: string;
  bytes: number;
  text: string;
};

/** 실제로 이번 질문과 함께 서버로 전달되는 자료 */
export type SourceFile = {
  name: string;
  text: string;
  /** 상한에 걸려 잘린 경우 true */
  truncated: boolean;
};

export type ChatDataParts = {
  sources: { files: SourceFile[] };
};

/** 이 앱의 메시지 타입. data-sources 파트로 자료를 함께 실어 보냅니다. */
export type ChatUIMessage = UIMessage<never, ChatDataParts>;

export function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function formatChars(chars: number): string {
  return `${chars.toLocaleString("ko-KR")}자`;
}

/**
 * 첨부 목록을 이번 요청에 실제로 보낼 자료로 변환합니다.
 * 파일당·전체 상한을 여기서 적용하므로, 화면에 펼쳐 보이는 내용과
 * 모델에 전달되는 내용이 정확히 같습니다.
 */
export function buildSourceFiles(attachments: Attachment[]): SourceFile[] {
  const files: SourceFile[] = [];
  let budget = MAX_CHARS_TOTAL;

  for (const attachment of attachments) {
    if (budget <= 0) break;
    const limit = Math.min(MAX_CHARS_PER_FILE, budget);
    const text = attachment.text.slice(0, limit);
    files.push({
      name: attachment.name,
      text,
      truncated: text.length < attachment.text.length,
    });
    budget -= text.length;
  }

  return files;
}

/** 서버에서 받은 값을 신뢰하지 않고 형태와 크기를 다시 검사합니다. */
export function clampSourceFiles(value: unknown): SourceFile[] {
  if (!Array.isArray(value)) return [];
  const files: SourceFile[] = [];
  let budget = MAX_CHARS_TOTAL;

  for (const item of value.slice(0, MAX_FILES)) {
    if (budget <= 0) break;
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.name !== "string" || typeof record.text !== "string") {
      continue;
    }
    const limit = Math.min(MAX_CHARS_PER_FILE, budget);
    const text = record.text.slice(0, limit);
    if (text.length === 0) continue;
    files.push({
      name: record.name.slice(0, 200),
      text,
      truncated: record.truncated === true || text.length < record.text.length,
    });
    budget -= text.length;
  }

  return files;
}

/** 마지막 사용자 메시지에 붙은 자료만 꺼냅니다 (이번 질문의 자료). */
export function extractLatestSources(messages: ChatUIMessage[]): SourceFile[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") continue;
    for (const part of message.parts ?? []) {
      if (part.type === "data-sources") {
        const data = part.data as { files?: unknown } | undefined;
        return clampSourceFiles(data?.files);
      }
    }
    return [];
  }
  return [];
}

export type FileIntakeResult = {
  accepted: Attachment[];
  errors: string[];
};

/**
 * 파일 목록을 검사하고 텍스트로 읽어들입니다.
 * 입력창(첨부)과 문서 조각 보기 화면이 같은 규칙을 쓰도록 여기에 모아둡니다.
 */
export async function readAttachments(
  fileList: FileList | File[] | null,
  existingCount: number,
): Promise<FileIntakeResult> {
  const accepted: Attachment[] = [];
  const errors: string[] = [];
  if (!fileList) return { accepted, errors };

  let slots = MAX_FILES - existingCount;

  for (const file of Array.from(fileList)) {
    if (!hasAcceptedExtension(file.name)) {
      errors.push(`${file.name}: TXT·MD 파일만 사용할 수 있습니다`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(
        `${file.name}: 파일이 너무 큽니다 (${formatBytes(file.size)} / 최대 ${formatBytes(MAX_FILE_BYTES)})`,
      );
      continue;
    }
    if (slots <= 0) {
      errors.push(`${file.name}: 최대 ${MAX_FILES}개까지 사용할 수 있습니다`);
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

  return { accepted, errors };
}
