/**
 * DESIGN.md > Navigation > Promo Banner
 * 최상단 풀폭 스트립. ink-deep 배경 + canvas 텍스트, body-sm-bold, padding md xl.
 * 작은 화면에서는 말줄임 처리하되 인라인 링크 어포던스를 유지합니다.
 */
export function PromoBanner() {
  return (
    <div className="w-full bg-ink-deep px-xl py-md text-canvas">
      <p className="mx-auto flex max-w-[1280px] items-center justify-center gap-xs truncate text-body-sm font-bold">
        <span className="truncate">
          gpt-4.1-mini로 답하는 한국어 어시스턴트입니다.
        </span>
        <span aria-hidden className="text-stone">
          ·
        </span>
        <span className="shrink-0 underline underline-offset-2">
          대화는 서버에 저장되지 않습니다
        </span>
      </p>
    </div>
  );
}
