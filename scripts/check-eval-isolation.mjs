/**
 * 평가 정답이 검색 자료로 새어들지 않는지 검사합니다.
 *
 *  1) knowledge/ 안에 평가 관련 파일이 없어야 합니다.
 *  2) 굽힌 지식 데이터(knowledge-data.ts)에 정답 문구가 없어야 합니다.
 *  3) 검색·답변 코드가 eval-set 을 가져다 쓰지 않아야 합니다
 *     (평가 실행 라우트만 예외).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const knowledgeFiles = readdirSync(join(root, "knowledge"));
if (knowledgeFiles.some((name) => /eval|정답|answer/i.test(name))) {
  failures.push(
    "knowledge/ 에 평가 관련 파일이 있습니다: " + knowledgeFiles.join(", "),
  );
}

const baked = readFileSync(join(root, "src/lib/knowledge-data.ts"), "utf8");
const evalSource = readFileSync(join(root, "src/lib/eval-set.ts"), "utf8");

// 정답이 원문과 겹치는 것은 정상입니다(정답은 문서에서 나옵니다).
// 새어들면 안 되는 것은 평가 세트 고유의 내용 — 질문 문장과 채점 메타데이터입니다.
const questions = [...evalSource.matchAll(/question:\s*\n?\s*"([^"]+)"/g)].map(
  (match) => match[1],
);
const expectedValues = [
  ...evalSource.matchAll(/expected:\s*\n?\s*"([^"]+)"/g),
].map((match) => match[1]);

if (questions.length === 0 || expectedValues.length === 0) {
  failures.push("eval-set.ts 에서 문항을 읽지 못했습니다 (검사 무효)");
}

for (const question of questions) {
  if (baked.includes(question)) {
    failures.push("knowledge-data.ts 에 평가 질문이 포함됨: " + question);
  }
}

// 채점용 필드 이름이 코퍼스에 나타나면 평가 세트가 섞여 들어간 것입니다.
for (const marker of ["requiredFiles", "forbiddenFiles", "mustInclude", "expected:"]) {
  if (baked.includes(marker)) {
    failures.push("knowledge-data.ts 에 채점 메타데이터가 포함됨: " + marker);
  }
}

const mustNotImport = [
  "src/lib/search.ts",
  "src/lib/answer.ts",
  "src/lib/ai.ts",
  "src/lib/knowledge.ts",
  "src/lib/rerank.ts",
  "src/app/api/chat/route.ts",
  "src/app/api/search/route.ts",
];
for (const file of mustNotImport) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  if (readFileSync(path, "utf8").includes("eval-set")) {
    failures.push(file + " 가 eval-set 을 가져옵니다");
  }
}

if (failures.length > 0) {
  console.error("[eval-isolation] 실패");
  for (const failure of failures) console.error("  - " + failure);
  process.exit(1);
}

console.log(
  "[eval-isolation] 통과 — 문항 " +
    questions.length +
    "건 / 정답 " +
    expectedValues.length +
    "건이 검색 자료·답변 경로와 분리되어 있습니다",
);
