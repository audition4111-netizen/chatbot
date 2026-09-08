import { questionList } from "@/lib/eval-set";

export const runtime = "nodejs";

/** 정답을 뺀 질문 목록. 실행 전 화면에 큐를 그릴 때 씁니다. */
export async function GET() {
  return Response.json({ questions: questionList() });
}
