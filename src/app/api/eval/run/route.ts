import { answerFromChunks } from "@/lib/answer";
import { findQuestion } from "@/lib/eval-set";
import type {
  EvalRunResult,
  PipelineResult,
  RetrievedChunk,
} from "@/lib/eval-types";
import { rerank } from "@/lib/rerank";
import { search } from "@/lib/search";
import { DEFAULT_FILTERS, type SearchChunk } from "@/lib/search-types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 리랭커에게 넘길 후보 수. 많을수록 되살릴 기회는 늘지만 느려집니다. */
const RERANK_CANDIDATES = 8;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "서버에 OPENAI_API_KEY가 없습니다." },
      { status: 500 },
    );
  }

  let questionId: string;
  let topK: number;
  try {
    const body = (await req.json()) as { questionId?: unknown; topK?: unknown };
    if (typeof body.questionId !== "string") {
      return Response.json({ error: "questionId가 필요합니다." }, { status: 400 });
    }
    questionId = body.questionId;
    topK =
      typeof body.topK === "number" && Number.isFinite(body.topK)
        ? Math.min(Math.max(1, Math.floor(body.topK)), 5)
        : 3;
  } catch {
    return Response.json({ error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const question = findQuestion(questionId);
  if (!question) {
    return Response.json({ error: "없는 문항입니다." }, { status: 404 });
  }

  try {
    // 세 파이프라인이 같은 검색 호출을 공유합니다.
    // 임베딩을 세 번 만들 이유가 없고, 비교 조건도 같아야 합니다.
    const found = await search(
      question.question,
      RERANK_CANDIDATES,
      DEFAULT_FILTERS,
    );

    const vectorChunks = found.vector.slice(0, topK);
    const hybridChunks = found.hybrid.slice(0, topK);
    const candidates: SearchChunk[] = found.hybrid.map((hit) => hit.chunk);

    // 시간은 각 파이프라인이 실제로 치르는 비용으로 계산합니다.
    // 벡터는 임베딩+코사인만, 하이브리드는 BM25와 결합까지 필요합니다.
    const vectorMs = found.timings.vector;
    const hybridMs =
      found.timings.vector + found.timings.keyword + found.timings.hybrid;

    const rerankStart = performance.now();
    const reranked = await rerank(question.question, candidates);
    const rerankMs = hybridMs + (performance.now() - rerankStart);
    const rerankTop = reranked.slice(0, topK);

    const [vectorAnswer, hybridAnswer, rerankAnswer] = await Promise.all([
      answerFromChunks(question.question, vectorChunks.map((h) => h.chunk)),
      answerFromChunks(question.question, hybridChunks.map((h) => h.chunk)),
      answerFromChunks(question.question, rerankTop.map((r) => r.chunk)),
    ]);

    const build = (
      id: PipelineResult["id"],
      chunks: RetrievedChunk[],
      retrievalMs: number,
      answer: { text: string; sourceFiles: string[]; ms: number },
    ): PipelineResult => ({
      id,
      chunks,
      answer: answer.text,
      sourceFiles: answer.sourceFiles,
      retrievalMs,
      answerMs: answer.ms,
      totalMs: retrievalMs + answer.ms,
    });

    const result: EvalRunResult = {
      questionId: question.id,
      question: question.question,
      category: question.category,
      topK,
      pipelines: [
        build(
          "vector",
          vectorChunks.map((hit) => ({ chunk: hit.chunk, score: hit.score })),
          vectorMs,
          vectorAnswer,
        ),
        build(
          "hybrid",
          hybridChunks.map((hit) => ({ chunk: hit.chunk, score: hit.score })),
          hybridMs,
          hybridAnswer,
        ),
        build(
          "rerank",
          rerankTop.map((item) => ({
            chunk: item.chunk,
            score: item.score,
            previousRank: item.previousRank,
            reason: item.reason,
          })),
          rerankMs,
          rerankAnswer,
        ),
      ],
      // 정답은 생성이 모두 끝난 지금 시점에 처음으로 응답에 실립니다.
      // 검색·리랭킹·답변 생성 어디에도 전달되지 않았습니다.
      gold: {
        expected: question.expected,
        requiredFiles: question.requiredFiles,
        forbiddenFiles: question.forbiddenFiles ?? [],
        mustInclude: question.mustInclude ?? [],
      },
    };

    return Response.json(result);
  } catch (error) {
    console.error("[api/eval/run] 실행 실패:", error);
    return Response.json(
      { error: "평가 실행에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
