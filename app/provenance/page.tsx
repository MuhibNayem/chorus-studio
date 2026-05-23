"use client";

import PageHeader from "@/components/shared/PageHeader";
import RefButton from "@/components/primitives/RefButton";
import ProvenanceDag from "@/components/run-detail/ProvenanceDag";
import { RefreshCw } from "lucide-react";

const ENTRIES = [
  { entryId: "plan", runId: "run_1", decisionType: "llm.plan", agentId: "ag_observability_v2", inputState: null, reasoning: null, output: null, parentIds: [] as string[], timestamp: new Date().toISOString(), metadata: {} },
  { entryId: "search", runId: "run_1", decisionType: "tool.search_traces", agentId: "ag_observability_v2", inputState: null, reasoning: null, output: null, parentIds: ["plan"], timestamp: new Date().toISOString(), metadata: {} },
  { entryId: "rag", runId: "run_1", decisionType: "rag.retrieve", agentId: "ag_observability_v2", inputState: null, reasoning: null, output: null, parentIds: ["plan"], timestamp: new Date().toISOString(), metadata: {} },
  { entryId: "chat", runId: "run_1", decisionType: "llm.chat", agentId: "ag_observability_v2", inputState: null, reasoning: null, output: null, parentIds: ["search", "rag"], timestamp: new Date().toISOString(), metadata: {} },
  { entryId: "guard", runId: "run_1", decisionType: "guardrail.toxicity", agentId: "ag_observability_v2", inputState: null, reasoning: null, output: null, parentIds: ["chat"], timestamp: new Date().toISOString(), metadata: {} },
];

export default function ProvenancePage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Provenance graph"
        sub="All decision paths across the last 24h, deduplicated by structure."
        actions={<RefButton variant="outline" icon={RefreshCw}>Recompute</RefButton>}
      />
      <ProvenanceDag entries={ENTRIES} />
    </div>
  );
}
