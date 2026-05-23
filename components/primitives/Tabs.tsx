"use client";

import { LucideIcon } from "lucide-react";

export default function RefTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number; icon: LucideIcon }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="ref-tabs">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <div
            key={t.key}
            className={`ref-tab ${isActive ? "active" : ""}`}
            onClick={() => onChange(t.key)}
          >
            <Icon size={12} />
            {t.label}
            {t.count != null && <span className="count">{t.count}</span>}
          </div>
        );
      })}
    </div>
  );
}
