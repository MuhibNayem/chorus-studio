"use client";

import { LucideIcon } from "lucide-react";

interface RefButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "default" | "lg";
  icon?: LucideIcon;
}

export default function RefButton({ variant = "outline", size = "default", icon: Icon, children, ...props }: RefButtonProps) {
  return (
    <button className={`ref-btn ${variant} ${size === "sm" ? "sm" : size === "lg" ? "lg" : ""}`} {...props}>
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}
