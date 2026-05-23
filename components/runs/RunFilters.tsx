"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import FilterChip from "@/components/primitives/FilterChip";

export default function RunFilters({
  filters,
  onChange,
  onSort,
  sortBy,
  frameworks,
}: {
  filters: { status: string; framework: string; search: string };
  onChange: (f: { status: string; framework: string; search: string }) => void;
  onSort: (s: string) => void;
  sortBy: string;
  frameworks: string[];
}) {
  const statuses = ["SUCCESS", "ERROR", "RUNNING"];
  const statusColors: Record<string, string> = {
    SUCCESS: "hsl(var(--success))",
    ERROR: "hsl(var(--error))",
    RUNNING: "hsl(var(--warning))",
  };

  return (
    <div className="filter-bar">
      <div style={{ position: "relative", width: 260 }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
        <input
          className="ref-input"
          style={{ paddingLeft: 30, fontFamily: "var(--font-mono)", fontSize: 11.5 }}
          placeholder="run_id, agent, model…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      {statuses.map((s) => (
        <FilterChip
          key={s}
          active={filters.status === s}
          onClick={() => onChange({ ...filters, status: filters.status === s ? "" : s })}
          dotColor={statusColors[s]}
        >
          {s.charAt(0) + s.slice(1).toLowerCase()}
        </FilterChip>
      ))}
      <div className="sep-v" />
      {frameworks.map((f) => (
        <FilterChip
          key={f}
          active={filters.framework === f}
          onClick={() => onChange({ ...filters, framework: filters.framework === f ? "" : f })}
        >
          {f}
        </FilterChip>
      ))}
      <div style={{ marginLeft: "auto" }} className="flex items-center gap-2">
        <span className="mute" style={{ fontSize: 11 }}>Sort:</span>
        <select
          className="ref-input"
          style={{ width: "auto", height: 28, paddingLeft: 8 }}
          value={sortBy}
          onChange={(e) => onSort(e.target.value)}
        >
          <option value="started">Newest</option>
          <option value="latency">Slowest</option>
          <option value="cost">Most expensive</option>
          <option value="tokens">Most tokens</option>
        </select>
      </div>
    </div>
  );
}
