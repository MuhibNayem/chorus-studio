"use client";

import { ReactNode } from "react";

export default function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        color: "hsl(var(--muted-foreground))",
        marginBottom: 5,
      }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground) / 0.6)", marginTop: 4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
