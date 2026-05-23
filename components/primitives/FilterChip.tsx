"use client";

import { X } from "lucide-react";

export default function FilterChip({
  active,
  onClick,
  children,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dotColor?: string;
}) {
  return (
    <button className={`filter-chip ${active ? "active" : ""}`} onClick={onClick}>
      {dotColor && (
        <span
          className="dot"
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: dotColor,
          }}
        />
      )}
      {children}
      {active && <X size={10} />}
    </button>
  );
}
