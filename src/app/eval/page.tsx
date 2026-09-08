import type { Metadata } from "next";

import { EvalWorkbench } from "@/components/eval/eval-workbench";

export const metadata: Metadata = {
  title: "검색 평가 · 챗봇",
  description: "벡터·하이브리드·리랭커를 같은 질문 세트로 비교하고 채점합니다.",
};

export default function Page() {
  return <EvalWorkbench />;
}
