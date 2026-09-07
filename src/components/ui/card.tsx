import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md > Cards & Containers
 * card-icon-feature / why-buy-tile 계열:
 * canvas 배경 + rounded.xl(16px) + hairline-soft 1px 보더, 그림자 없음(플랫).
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

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-subtitle-lg font-bold text-ink-deep", className)}
      {...props}
    />
  );
}

function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-body-sm text-charcoal", className)} {...props} />
  );
}

export { Card, CardTitle, CardBody };
