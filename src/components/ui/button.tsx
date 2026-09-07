"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md > Components > Buttons
 * - 모든 버튼은 {rounded.full} = 100px 필 형태입니다. 각진 버튼은 금지.
 * - hover 상태는 문서화되지 않음(no-hover policy) → pressed(active) 상태만 정의합니다.
 * - typography.button-md = 14px / 700 / -0.14px  → text-body-sm font-bold
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-xs whitespace-nowrap rounded-pill text-body-sm font-bold transition-colors duration-200 ease-out disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-ink-button text-on-ink-button active:bg-charcoal disabled:bg-disabled-text disabled:text-canvas",
        buyCta:
          "bg-primary text-on-primary active:bg-primary-deep disabled:bg-disabled-text disabled:text-canvas",
        secondary:
          "border-2 border-ink-deep bg-transparent text-ink-deep active:bg-surface-soft disabled:border-disabled-text disabled:text-disabled-text",
        ghost:
          "border-2 border-[rgba(10,19,23,0.12)] bg-transparent text-ink-deep active:bg-surface-soft disabled:text-disabled-text",
        pillTab:
          "border border-hairline bg-canvas text-ink active:bg-surface-soft",
        pillTabActive: "bg-ink-deep text-canvas",
        iconCircular:
          "rounded-full bg-canvas text-ink active:bg-surface-soft disabled:text-disabled-text",
      },
      size: {
        primary: "px-[30px] py-[14px]",
        secondary: "px-[28px] py-[12px]",
        ghost: "px-[22px] py-[10px]",
        pill: "px-base py-xs",
        icon: "size-[40px] max-md:size-[44px] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "primary",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
