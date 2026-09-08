/**
 * 검색용 토크나이저.
 *
 * 한국어는 조사가 붙어 "숙박비", "숙박비는", "숙박비가" 가 모두 다른 문자열이 됩니다.
 * 공백 기준으로만 자르면 BM25가 거의 걸리지 않으므로 두 가지를 함께 씁니다.
 *   1) 조사를 떼어낸 어간
 *   2) 어간의 글자 2-gram (형태소 분석기 없이 부분 일치를 잡는 방법)
 *
 * 오류 코드(APP-017)는 하이픈을 유지한 원형과 분리형(app, 017, app017)을
 * 모두 넣어, "APP-017" / "app 017" / "017" 중 무엇으로 물어도 걸리게 합니다.
 */

/** 길이가 긴 것부터 검사해야 "에서는"이 "는"보다 먼저 잡힙니다. */
const JOSA = [
  "에서는", "에서도", "으로는", "으로도", "에게서", "이라고", "라고는",
  "에서", "에게", "한테", "으로", "처럼", "보다", "까지", "부터", "마다",
  "조차", "밖에", "이나", "라도", "이며", "이고", "하고", "이란", "이는",
  "입니다", "습니다", "합니다", "됩니다", "한다", "된다", "이다", "였다", "했다",
  "은", "는", "이", "가", "을", "를", "의", "에", "로", "과", "와", "도",
  "만", "랑", "야", "여",
];

const TOKEN_RUN = /[a-z0-9]+(?:[-_][a-z0-9]+)*|[가-힣]+/g;

/** 조사를 떼어낸 어간. 2글자 미만으로 줄어들면 원형을 유지합니다. */
export function stripJosa(word: string): string {
  for (const josa of JOSA) {
    if (word.length > josa.length && word.endsWith(josa)) {
      const stem = word.slice(0, word.length - josa.length);
      if (stem.length >= 2) return stem;
    }
  }
  return word;
}

function pushLatin(tokens: string[], run: string): void {
  tokens.push(run);

  if (run.includes("-") || run.includes("_")) {
    const parts = run.split(/[-_]/).filter(Boolean);
    for (const part of parts) tokens.push(part);
    if (parts.length > 1) tokens.push(parts.join(""));
  }

  // app017 처럼 붙어 있는 경우 문자/숫자 경계로도 나눕니다.
  const segments = run.match(/[a-z]+|[0-9]+/g) ?? [];
  if (segments.length > 1) {
    for (const segment of segments) tokens.push(segment);
  }
}

function pushHangul(tokens: string[], run: string): void {
  tokens.push(run);

  const stem = stripJosa(run);
  if (stem !== run) tokens.push(stem);

  if (stem.length >= 2) {
    for (let i = 0; i + 2 <= stem.length; i += 1) {
      tokens.push(stem.slice(i, i + 2));
    }
  }
}

export function tokenize(text: string): string[] {
  const normalized = text.normalize("NFKC").toLowerCase();
  const tokens: string[] = [];

  for (const match of normalized.matchAll(TOKEN_RUN)) {
    const run = match[0];
    if (/^[가-힣]/.test(run)) pushHangul(tokens, run);
    else pushLatin(tokens, run);
  }

  return tokens;
}

/** 화면에서 질의가 어떻게 쪼개졌는지 보여줄 때 씁니다. */
export function uniqueTokens(text: string): string[] {
  return [...new Set(tokenize(text))];
}
