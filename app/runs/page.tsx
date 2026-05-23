"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokens, formatCost, formatDuration, formatDate } from "@/lib/utils";
import type { Run } from "@/types";

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", framework: "", search: "" });

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (filters.status) params.status = filters.status;
    if (filters.framework) params.framework = filters.framework;
    if (filters.search) params.search = filters.search;
    api
      .listRuns(params)
      .then((res) => {
        setRuns(res.runs);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page, size, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const frameworks = Array.from(new Set(runs.map((r) => r.framework)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Runs</h2>
          <p className="text-muted-foreground">{total.toLocaleString()} total runs</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search runs..."
          className="w-64"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <Select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="ERROR">Error</option>
          <option value="RUNNING">Running</option>
        </Select>
        <Select
          value={filters.framework}
          onChange={(e) => setFilters((f) => ({ ...f, framework: e.target.value }))}
        >
          <option value="">All Frameworks</option>
          {frameworks.map((fw) => (
            <option key={fw} value={fw}>{fw}</option>
          ))}
        </Select>
        <Button onClick={load}>Filter</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setFilters({ status: "", framework: "", search: "" });
            setPage(0);
          }}
        >
          Reset
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Run ID</th>
                  <th className="px-4 py-3 text-left font-medium">Framework</th>
                  <th className="px-4 py-3 text-left font-medium">Agent</th>
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-right font-medium">Tokens</th>
                  <th className="px-4 py-3 text-right font-medium">Cost</th>
                  <th className="px-4 py-3 text-right font-medium">Latency</th>
                  <th className="px-4 py-3 text-left font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-12 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-12 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-12 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    </tr>
                  ))
                ) : runs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No runs found. Send OTLP traces to Chorus Observe to see data here.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.runId} className="border-b hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            run.status === "SUCCESS"
                              ? "success"
                              : run.status === "ERROR"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/runs/${run.runId}`} className="font-mono text-primary hover:underline">
                          {run.runId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{run.framework}</td>
                      <td className="px-4 py-3">{run.agentId}</td>
                      <td className="px-4 py-3 text-muted-foreground">{run.model ?? "—"}</td>
                      <td className="px-4 py-3 text-right">{formatTokens(run.totalTokens)}</td>
                      <td className="px-4 py-3 text-right">{formatCost(run.totalCost)}</td>
                      <td className="px-4 py-3 text-right">{formatDuration(run.latencyMs)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(run.startTime)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {runs.length} of {total} runs
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={runs.length < size} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
