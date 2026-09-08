import { search } from "@/lib/search";
import {
  DEFAULT_TOP_K,
  MAX_TOP_K,
  type PeriodMode,
  type SearchFilters,
} from "@/lib/search-types";

// 임베딩 호출이 있으므로 서버에서만 실행됩니다.
export const runtime = "nodejs";
export const maxDuration = 30;

const PERIOD_MODES: PeriodMode[] = ["all", "current", "date"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 클라이언트 입력을 신뢰하지 않고 형태를 다시 검사합니다. */
function parseFilters(raw: unknown): SearchFilters {
  const value = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  const fileNames = Array.isArray(value.fileNames)
    ? value.fileNames
        .filter((name): name is string => typeof name === "string")
        .slice(0, 50)
        .map((name) => name.slice(0, 200))
    : [];

  const periodMode = PERIOD_MODES.includes(value.periodMode as PeriodMode)
    ? (value.periodMode as PeriodMode)
    : "all";

  const asOf =
    typeof value.asOf === "string" && ISO_DATE.test(value.asOf)
      ? value.asOf
      : null;

  // 기준일 없이 date 모드가 오면 필터를 걸 수 없으므로 전체로 되돌립니다.
  if (periodMode === "date" && asOf === null) {
    return { fileNames, periodMode: "all", asOf: null };
  }

  return { fileNames, periodMode, asOf };
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "서버에 OPENAI_API_KEY가 없습니다. 로컬은 .env.local, 배포는 Vercel 환경 변수를 확인하세요.",
      },
      { status: 500 },
    );
  }

  let query: string;
  let topK: number;
  let filters: SearchFilters;
  try {
    const body = (await req.json()) as {
      query?: unknown;
      topK?: unknown;
      filters?: unknown;
    };
    if (typeof body.query !== "string" || body.query.trim().length === 0) {
      return Response.json({ error: "검색어를 입력해 주세요." }, { status: 400 });
    }
    query = body.query.trim().slice(0, 500);
    topK =
      typeof body.topK === "number" && Number.isFinite(body.topK)
        ? Math.min(Math.max(1, Math.floor(body.topK)), MAX_TOP_K)
        : DEFAULT_TOP_K;
    filters = parseFilters(body.filters);
  } catch {
    return Response.json({ error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  try {
    return Response.json(await search(query, topK, filters));
  } catch (error) {
    console.error("[api/search] 검색 실패:", error);
    return Response.json(
      { error: "검색에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
