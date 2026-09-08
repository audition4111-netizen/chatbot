import { tokenize } from "@/lib/tokenize";

/**
 * BM25 키워드 검색.
 * k1은 용어 빈도의 포화 정도, b는 문서 길이 정규화 강도입니다.
 */
const K1 = 1.2;
const B = 0.75;

export type Bm25Hit = { id: string; score: number };

export class Bm25Index {
  /** term -> (docId -> 빈도) */
  private postings = new Map<string, Map<string, number>>();
  private docLengths = new Map<string, number>();
  private averageLength = 0;
  private docCount = 0;

  constructor(documents: Array<{ id: string; text: string }>) {
    let totalLength = 0;

    for (const document of documents) {
      const tokens = tokenize(document.text);
      this.docLengths.set(document.id, tokens.length);
      totalLength += tokens.length;

      for (const token of tokens) {
        let posting = this.postings.get(token);
        if (!posting) {
          posting = new Map();
          this.postings.set(token, posting);
        }
        posting.set(document.id, (posting.get(document.id) ?? 0) + 1);
      }
    }

    this.docCount = documents.length;
    this.averageLength = this.docCount > 0 ? totalLength / this.docCount : 0;
  }

  private idf(term: string): number {
    const df = this.postings.get(term)?.size ?? 0;
    if (df === 0) return 0;
    // 확률적 IDF. 1을 더해 음수가 되지 않게 합니다.
    return Math.log(1 + (this.docCount - df + 0.5) / (df + 0.5));
  }

  search(query: string): Bm25Hit[] {
    const queryTerms = new Set(tokenize(query));
    const scores = new Map<string, number>();

    for (const term of queryTerms) {
      const posting = this.postings.get(term);
      if (!posting) continue;

      const idf = this.idf(term);

      for (const [docId, frequency] of posting) {
        const length = this.docLengths.get(docId) ?? 0;
        const normalization =
          this.averageLength > 0 ? length / this.averageLength : 1;
        const denominator = frequency + K1 * (1 - B + B * normalization);
        const contribution = idf * ((frequency * (K1 + 1)) / denominator);
        scores.set(docId, (scores.get(docId) ?? 0) + contribution);
      }
    }

    return [...scores.entries()]
      .map(([id, score]) => ({ id, score }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}
