"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RunFilters from "@/components/runs/RunFilters";
import RunsTable from "@/components/runs/RunsTable";
import { RefCard } from "@/components/primitives/RefCard";
import { SlidersHorizontal, ExternalLink, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { Run } from "@/types";

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", framework: "", search: "" });
  const [sortBy, setSortBy] = useState("started");

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (filters.status) params.status = filters.status;
    if (filters.framework) params.framework = filters.framework;
    if (filters.search) params.search = filters.search;
    api.listRuns(params)
      .then((res) => {
        setRuns(res.runs);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page, size, filters]);

  useEffect(() => { load(); }, [load]);

  const frameworks = Array.from(new Set(runs.map((r) => r.framework)));
  const totalPages = Math.ceil(total / size);

  const filtered = runs.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.framework && r.framework !== filters.framework) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!(r.runId + r.agentId + (r.model ?? "") + r.framework).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Runs"
        accent={`/ ${filtered.length.toLocaleString()} of ${total.toLocaleString()}`}
        sub="All agent executions, newest first."
        actions={
          <>
            <RefButton variant="outline" icon={SlidersHorizontal}>Customize</RefButton>
            <RefButton variant="outline" icon={ExternalLink}>Export</RefButton>
            <RefButton variant="primary" icon={PlayCircle}>Replay run</RefButton>
          </>
        }
      />

      <RunFilters
        filters={filters}
        onChange={setFilters}
        onSort={setSortBy}
        sortBy={sortBy}
        frameworks={frameworks}
      />

      {loading ? (
        <RefCard>
          <div className="card-pad">
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </RefCard>
      ) : (
        <RefCard style={{ overflow: "hidden" }}>
          <RunsTable runs={filtered} />
        </RefCard>
      )}

      <div className="flex items-center justify-between gap-4" style={{ marginTop: 14 }}>
        <div className="mute" style={{ fontSize: 12 }}>
          Showing <span className="mono tabular">1–{filtered.length}</span> of <span className="mono tabular">{total.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <RefButton variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={13} /> Prev
          </RefButton>
          <span className="mute mono tabular" style={{ fontSize: 11, padding: "0 8px" }}>
            {page + 1} / {totalPages}
          </span>
          <RefButton variant="outline" size="sm" disabled={filtered.length < size} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight size={13} />
          </RefButton>
        </div>
      </div>
    </div>
  );
}
