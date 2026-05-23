"use client";

export default function CodeBlock({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <pre className={`code-block ${className}`} style={style}>
      {children}
    </pre>
  );
}
