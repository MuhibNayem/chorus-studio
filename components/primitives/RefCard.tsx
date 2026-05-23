"use client";

import { ReactNode } from "react";

export function RefCard({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`ref-card ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="card-h">
      <div>
        <div className="card-title"><span className="h-bullet" />{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function CardPad({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-pad ${className}`}>{children}</div>;
}
