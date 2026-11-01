import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-sm border border-[#888888] bg-background px-3 py-2 text-base text-[#333333] shadow-inner ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:italic placeholder:text-[#636363] focus-visible:border-primary focus-visible:outline-none aria-[invalid=true]:border-destructive aria-[invalid=true]:border-2 disabled:cursor-not-allowed disabled:bg-[#f0f0f0] disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
