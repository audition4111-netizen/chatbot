/**
 * knowledge/*.md 를 읽어 src/lib/knowledge-data.ts 로 굽습니다.
 *
 * 런타임 파일 읽기를 쓰지 않는 이유: 서버리스 배포에서 파일이 번들에
 * 포함되는지가 환경에 따라 달라집니다. 빌드 시점에 모듈로 만들어 두면
 * 로컬과 Vercel에서 동일하게 동작합니다.
 *
 * 문서를 고친 뒤에는 `npm run knowledge` 를 실행하거나, 그냥
 * `npm run build` 하면 prebuild 로 자동 실행됩니다.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_DIR = join(process.cwd(), "knowledge");
const OUTPUT = join(process.cwd(), "src", "lib", "knowledge-data.ts");

/** 문서 머리말의 "- 키: 값" 목록에서 메타데이터를 읽습니다. */
function parseMeta(text) {
  const meta = {};
  for (const line of text.split("\n").slice(0, 12)) {
    const match = line.match(/^-\s*([^:]+):\s*(.+)$/);
    if (match) meta[match[1].trim()] = match[2].trim();
  }
  return meta;
}

function parseTitle(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

const files = readdirSync(SOURCE_DIR)
  .filter((name) => name.toLowerCase().endsWith(".md"))
  .sort();

if (files.length === 0) {
  throw new Error(`knowledge/ 에 마크다운 문서가 없습니다: ${SOURCE_DIR}`);
}

const documents = files.map((fileName) => {
  const text = readFileSync(join(SOURCE_DIR, fileName), "utf8").replace(/\r\n/g, "\n");
  const meta = parseMeta(text);
  return {
    fileName,
    title: parseTitle(text) ?? fileName,
    version: meta["문서 버전"] ?? null,
    period: meta["적용 기간"] ?? null,
    status: meta["상태"] ?? null,
    text: text.trim(),
  };
});

const banner = `// 이 파일은 scripts/build-knowledge.mjs 가 knowledge/*.md 에서 생성합니다.
// 직접 고치지 마세요. 문서를 바꾼 뒤 \`npm run knowledge\` 를 실행하세요.
// 생성 대상: ${files.length}개 문서

import type { KnowledgeDocument } from "@/lib/knowledge";

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = ${JSON.stringify(documents, null, 2)};
`;

writeFileSync(OUTPUT, banner, "utf8");

const totalChars = documents.reduce((sum, doc) => sum + doc.text.length, 0);
console.log(`[knowledge] ${documents.length}개 문서 / ${totalChars.toLocaleString("ko-KR")}자 → src/lib/knowledge-data.ts`);
for (const doc of documents) {
  const status = doc.status ? ` [${doc.status}]` : "";
  console.log(`  - ${doc.fileName} (버전 ${doc.version ?? "?"}${status})`);
}
