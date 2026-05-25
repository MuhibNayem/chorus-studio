"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onFocus, onBlur, style, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-[10px] px-3 py-2 text-xs font-mono",
          "placeholder:text-muted-foreground/50 outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-xs file:font-medium",
          className
        )}
        style={{
          background: "hsl(var(--card-elev))",
          color: "hsl(var(--foreground))",
          border: focused
            ? "1px solid hsl(var(--primary) / 0.5)"
            : "1px solid hsl(var(--border) / 0.2)",
          boxShadow: focused ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          ...style,
        }}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
export { Input };
