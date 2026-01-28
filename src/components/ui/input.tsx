import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> { }

function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2 text-base transition-all duration-200",
        // Placeholder
        "placeholder:text-muted-foreground/60",
        // Focus states
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // Selection
        "selection:bg-primary selection:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
