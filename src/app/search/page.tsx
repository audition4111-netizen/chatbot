import type { Metadata } from "next";

import { SearchWorkbench } from "@/components/search/search-workbench";

export const metadata: Metadata = {
  title: "검색 비교 · 챗봇",
  description: "키워드(BM25)·벡터·하이브리드(RRF) 검색 결과를 나란히 비교합니다.",
};

export default function Page() {
  return <SearchWorkbench />;
}
