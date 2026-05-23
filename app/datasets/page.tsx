"use client";

import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import { RefCard } from "@/components/primitives/RefCard";
import { ExternalLink, Plus, Database, PlayCircle, Eye } from "lucide-react";

const DATASETS = [
  { id: "ds_eval_router_v3", name: "router-v3 regression", examples: 482, updated: "2h ago", owner: "platform", tags: ["regression", "router"] },
  { id: "ds_guardrail_red", name: "guardrail-red-team", examples: 1240, updated: "1d ago", owner: "safety", tags: ["safety", "jailbreak"] },
  { id: "ds_obs_smoke", name: "observability-smoke", examples: 64, updated: "5h ago", owner: "platform", tags: ["smoke"] },
  { id: "ds_research_long", name: "research-long-context", examples: 218, updated: "3d ago", owner: "research", tags: ["long-context"] },
];

export default function DatasetsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Datasets"
        accent={`/ ${DATASETS.length}`}
        sub="Curated example sets, sliced from production traces."
        actions={
          <>
            <RefButton variant="outline" icon={ExternalLink}>Import CSV</RefButton>
            <RefButton variant="primary" icon={Plus}>New dataset</RefButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        {DATASETS.map((d) => (
          <RefCard key={d.id}>
            <div className="card-pad flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="flex items-center gap-2">
                    <Database size={14} style={{ color: "hsl(var(--rag))" }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <div className="mono mute" style={{ fontSize: 11, marginTop: 4 }}>{d.id}</div>
                </div>
                <RefBadge variant="muted">{d.owner}</RefBadge>
              </div>

              <div className="flex items-center gap-4" style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                <span><span className="mono tabular" style={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: 13 }}>{d.examples}</span> examples</span>
                <span>updated {d.updated}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {d.tags.map((t) => <span key={t} className="filter-chip" style={{ cursor: "default", pointerEvents: "none" }}>{t}</span>)}
              </div>

              <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
                <RefButton size="sm" variant="outline" icon={PlayCircle}>Run eval</RefButton>
                <RefButton size="sm" variant="ghost" icon={Eye}>Browse</RefButton>
              </div>
            </div>
          </RefCard>
        ))}
      </div>
    </div>
  );
}
