import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md > Badges & Status
 * typography.caption-bold = 12px / 700, rounded.full, padding 4px 10px
 */
const badgeVariants = cva(
  "inline-flex items-center gap-xxs rounded-pill px-[10px] py-xxs text-caption font-bold",
  {
    variants: {
      variant: {
        promo: "bg-warning text-ink-deep",
        attention: "bg-attention text-canvas",
        success: "bg-success text-canvas",
        critical: "bg-critical text-canvas",
      },
    },
    defaultVariants: { variant: "success" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
