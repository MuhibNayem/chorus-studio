import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  dot?: boolean;
}

const DOT_COLORS: Record<string, string> = {
  default: "bg-primary-foreground",
  secondary: "bg-secondary-foreground",
  destructive: "bg-red-400",
  outline: "bg-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

function Badge({ className, variant = "default", dot = false, children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-primary/15 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
    destructive: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900",
    outline: "border border-border bg-transparent text-foreground",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900",
    warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", DOT_COLORS[variant])} />
      )}
      {children}
    </span>
  );
}

export { Badge };
