import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-sm border border-[#888888] bg-white px-3 py-2 text-base text-[#333333] shadow-inner placeholder:italic placeholder:text-[#636363] focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#f0f0f0] disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
