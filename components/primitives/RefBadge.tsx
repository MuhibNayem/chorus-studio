"use client";

interface RefBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "error" | "warning" | "muted" | "primary" | "llm" | "tool" | "guardrail" | "rag";
  dot?: boolean;
}

export default function RefBadge({ variant = "muted", dot = false, children, ...props }: RefBadgeProps) {
  return (
    <span className={`ref-badge ${variant}`} {...props}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
