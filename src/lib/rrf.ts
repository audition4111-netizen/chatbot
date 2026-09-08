/**
 * Reciprocal Rank Fusion.
 *
 * 점수 체계가 다른 여러 검색 결과를 순위만으로 합칩니다.
 * BM25 점수와 코사인 유사도는 단위가 달라 그대로 더할 수 없지만,
 * 순위는 비교 가능하므로 1/(k + 순위) 를 더합니다.
 * k는 상위권의 영향력을 낮춰 한 검색기가 결과를 독점하지 않게 합니다.
 */
export const RRF_K = 60;

export type RankedList = {
  /** 결과 목록에서의 이름 (화면에 근거로 표시) */
  source: string;
  /** 1위부터 순서대로 나열된 문서 id */
  ids: string[];
};

export type FusedHit = {
  id: string;
  score: number;
  /** 각 검색기에서 몇 위였는지. 해당 목록에 없으면 값이 없습니다. */
  ranks: Record<string, number>;
};

export function reciprocalRankFusion(
  lists: RankedList[],
  k: number = RRF_K,
): FusedHit[] {
  const merged = new Map<string, FusedHit>();

  for (const list of lists) {
    list.ids.forEach((id, index) => {
      const rank = index + 1;
      // 같은 조각이 여러 목록에 있어도 항목은 하나만 만들고 점수만 더합니다.
      const existing = merged.get(id);
      if (existing) {
        existing.score += 1 / (k + rank);
        existing.ranks[list.source] = rank;
      } else {
        merged.set(id, {
          id,
          score: 1 / (k + rank),
          ranks: { [list.source]: rank },
        });
      }
    });
  }

  return [...merged.values()].sort((a, b) => b.score - a.score);
}
