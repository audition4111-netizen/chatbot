import type { Metadata } from "next";

import { ChunkWorkbench } from "@/components/chunks/chunk-workbench";

export const metadata: Metadata = {
  title: "문서 조각 보기 · 챗봇",
  description: "TXT·MD 문서를 문단 단위로 나눈 결과를 원문과 나란히 확인합니다.",
};

export default function Page() {
  return <ChunkWorkbench />;
}
