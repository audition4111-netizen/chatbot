/**
 * 문단을 고려한 텍스트 분할.
 *
 * 설계 원칙: 모든 조각은 원문의 연속된 구간입니다.
 * chunk.text === source.slice(chunk.start, chunk.end) 가 항상 성립하므로,
 * 원문과 조각을 나란히 놓고 위치를 그대로 대응시킬 수 있습니다.
 */

export type ChunkOptions = {
  /** 조각 하나의 최대 글자 수 (겹침 포함) */
  maxChars: number;
  /** 앞 조각 끝에서 가져오는 겹침 글자 수 */
  overlapChars: number;
};

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  maxChars: 500,
  overlapChars: 80,
};

export const CHUNK_LIMITS = {
  minChars: 100,
  maxChars: 2000,
  charsStep: 50,
  minOverlap: 0,
  overlapStep: 10,
} as const;

/** 겹침은 조각 크기의 절반을 넘지 않도록 제한합니다. */
export function maxOverlapFor(maxChars: number): number {
  return Math.floor(maxChars / 2);
}

export type DocumentChunk = {
  id: string;
  fileName: string;
  /** 이 조각이 속한 가장 가까운 상위 제목 (없으면 문서 첫 줄) */
  title: string | null;
  /** 파일 안에서의 순번 (1부터) */
  index: number;
  /** 겹침을 포함한 시작 오프셋 */
  start: number;
  /** 겹침이 끝나고 이 조각의 본 내용이 시작되는 오프셋 */
  coreStart: number;
  /** 끝 오프셋 (미포함) */
  end: number;
  /** source.slice(start, end) 와 동일 */
  text: string;
};

type Block = {
  start: number;
  end: number;
  title: string | null;
  /** 이 문단 자체가 제목 줄인지 */
  isHeading: boolean;
};

type Group = {
  coreStart: number;
  end: number;
  title: string | null;
};

const ATX_HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const SETEXT_UNDERLINE = /^(?:=|-){3,}\s*$/;

/** 문서 전체를 대표할 제목: 첫 번째 비어 있지 않은 줄 */
function documentTitle(source: string): string | null {
  for (const line of source.split("\n")) {
    const trimmed = line.trim().replace(ATX_HEADING, "$2");
    if (trimmed.length > 0) return trimmed.slice(0, 80);
  }
  return null;
}

/** 블록(문단)에서 제목을 읽어냅니다. 제목이 아니면 null */
function headingOf(blockText: string): string | null {
  const lines = blockText.split("\n");
  const first = lines[0]?.trim() ?? "";

  const atx = first.match(ATX_HEADING);
  if (atx) return atx[2].trim().slice(0, 80);

  const second = lines[1]?.trim() ?? "";
  if (first.length > 0 && SETEXT_UNDERLINE.test(second)) {
    return first.slice(0, 80);
  }

  return null;
}

/** 빈 줄을 경계로 문단을 나눕니다. 반환 구간은 앞뒤 공백을 제외합니다. */
function splitBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const separator = /\n[ \t]*\n/g;
  const boundaries: number[] = [0];
  let match: RegExpExecArray | null;

  while ((match = separator.exec(source)) !== null) {
    boundaries.push(match.index, separator.lastIndex);
  }
  boundaries.push(source.length);

  let currentTitle = documentTitle(source);

  for (let i = 0; i < boundaries.length; i += 2) {
    let start = boundaries[i];
    let end = boundaries[i + 1];
    if (end === undefined) break;

    while (start < end && /\s/.test(source[start])) start += 1;
    while (end > start && /\s/.test(source[end - 1])) end -= 1;
    if (start >= end) continue;

    const heading = headingOf(source.slice(start, end));
    if (heading) currentTitle = heading;

    blocks.push({ start, end, title: currentTitle, isHeading: heading !== null });
  }

  return blocks;
}

/** 문장 단위 경계. 마침표류와 줄바꿈에서 끊습니다. */
function sentenceRanges(
  source: string,
  start: number,
  end: number,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const terminators = ".!?。！？";
  const closers = /[\s"'’”)\]」』]/;

  let sentenceStart = start;
  let i = start;

  while (i < end) {
    const char = source[i];
    if (char === "\n") {
      ranges.push({ start: sentenceStart, end: i + 1 });
      i += 1;
      sentenceStart = i;
      continue;
    }
    if (terminators.includes(char)) {
      let j = i + 1;
      while (j < end && closers.test(source[j])) j += 1;
      ranges.push({ start: sentenceStart, end: j });
      i = j;
      sentenceStart = j;
      continue;
    }
    i += 1;
  }

  if (sentenceStart < end) ranges.push({ start: sentenceStart, end });
  return ranges.filter((range) => range.end > range.start);
}

/** maxChars를 넘는 문단을 문장 단위로 나눕니다. 문장 하나가 넘으면 잘라냅니다. */
function splitOversizedBlock(
  source: string,
  block: Block,
  coreBudget: number,
): Group[] {
  const groups: Group[] = [];
  const sentences = sentenceRanges(source, block.start, block.end);

  let currentStart: number | null = null;
  let currentEnd = block.start;

  const flush = () => {
    if (currentStart !== null) {
      groups.push({ coreStart: currentStart, end: currentEnd, title: block.title });
      currentStart = null;
    }
  };

  for (const sentence of sentences) {
    const length = sentence.end - sentence.start;

    if (length > coreBudget) {
      flush();
      for (let offset = sentence.start; offset < sentence.end; offset += coreBudget) {
        groups.push({
          coreStart: offset,
          end: Math.min(offset + coreBudget, sentence.end),
          title: block.title,
        });
      }
      currentEnd = sentence.end;
      continue;
    }

    if (currentStart === null) {
      currentStart = sentence.start;
      currentEnd = sentence.end;
      continue;
    }

    if (sentence.end - currentStart <= coreBudget) {
      currentEnd = sentence.end;
    } else {
      flush();
      currentStart = sentence.start;
      currentEnd = sentence.end;
    }
  }

  flush();
  return groups;
}

/** 겹침 시작점이 단어 중간에 걸리지 않도록 공백 뒤로 밀어냅니다. */
function snapToBoundary(source: string, from: number, limit: number): number {
  if (from <= 0) return 0;
  for (let i = from; i < limit; i += 1) {
    if (/\s/.test(source[i])) {
      let j = i;
      while (j < limit && /\s/.test(source[j])) j += 1;
      return j;
    }
  }
  return from;
}

export function chunkDocument(
  fileName: string,
  source: string,
  options: ChunkOptions,
): DocumentChunk[] {
  const maxChars = Math.max(CHUNK_LIMITS.minChars, Math.floor(options.maxChars));
  const overlapChars = Math.min(
    Math.max(0, Math.floor(options.overlapChars)),
    maxOverlapFor(maxChars),
  );

  // 겹침을 포함한 조각 길이가 maxChars를 넘지 않도록,
  // 본 내용(코어)에 쓸 수 있는 예산은 maxChars - overlapChars 입니다.
  const coreBudget = Math.max(1, maxChars - overlapChars);

  const blocks = splitBlocks(source);
  const groups: Group[] = [];
  let current: Group | null = null;

  const flush = () => {
    if (current) {
      groups.push(current);
      current = null;
    }
  };

  for (const block of blocks) {
    const blockLength = block.end - block.start;

    // 제목 줄은 항상 새 조각을 시작합니다.
    // 조각 하나가 하나의 절에만 속하게 되어 제목이 정확해집니다.
    if (block.isHeading) flush();

    if (blockLength > coreBudget) {
      flush();
      groups.push(...splitOversizedBlock(source, block, coreBudget));
      continue;
    }

    if (current === null) {
      current = { coreStart: block.start, end: block.end, title: block.title };
      continue;
    }

    if (block.end - current.coreStart <= coreBudget) {
      current.end = block.end;
    } else {
      flush();
      current = { coreStart: block.start, end: block.end, title: block.title };
    }
  }

  flush();

  return groups.map((group, index) => {
    let start = group.coreStart;

    if (index > 0 && overlapChars > 0) {
      const floor = Math.max(0, groups[index - 1].coreStart);
      const candidate = Math.max(floor, group.coreStart - overlapChars);
      start = snapToBoundary(source, candidate, group.coreStart);
    }

    return {
      id: `${fileName}#${index}`,
      fileName,
      title: group.title,
      index: index + 1,
      start,
      coreStart: group.coreStart,
      end: group.end,
      text: source.slice(start, group.end),
    };
  });
}
