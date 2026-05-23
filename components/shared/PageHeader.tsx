"use client";

import { ReactNode } from "react";

export default function PageHeader({
  title,
  accent,
  sub,
  actions,
}: {
  title: string;
  accent?: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-h">
      <div>
        <h1 className="page-title">
          {title}
          {accent && <span className="accent"> {accent}</span>}
        </h1>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
