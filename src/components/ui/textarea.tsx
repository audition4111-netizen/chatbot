"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md > Inputs & Forms > text-input
 * background canvas / border 1px hairline / rounded.lg(8px) / padding md(12px)
 * focused: border 2px fb-blue (보더가 2px가 되므로 padding을 1px 보정해 높이 유지)
 * error:   border 1px critical-strong
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-lg border border-hairline bg-canvas p-md text-body-md text-ink outline-none",
        "placeholder:text-stone",
        "focus:border-2 focus:border-fb-blue focus:p-[11px]",
        "disabled:cursor-not-allowed disabled:text-disabled-text",
        "aria-invalid:border-critical-strong",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
