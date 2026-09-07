import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md > Cards & Containers
 * card-icon-feature 계열: canvas 배경 + rounded.xl(16px) + hairline-soft 1px 보더.
 * DESIGN.md의 "마케팅 카드에는 무거운 그림자를 쓰지 않는다" 규칙에 따라 플랫입니다.
 */
function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline-soft bg-canvas p-xl",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
