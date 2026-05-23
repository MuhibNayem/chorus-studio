"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import CodeBlock from "@/components/shared/CodeBlock";
import { Copy } from "lucide-react";
import type { Run } from "@/types";

export default function RawTab({ run }: { run: Run }) {
  const json = {
    runId: run.runId,
    status: run.status,
    agent: { id: run.agentId, framework: run.framework },
    model: run.model,
    metrics: { tokens: run.totalTokens, costUsd: run.totalCost, latencyMs: run.latencyMs },
    startTime: run.startTime,
    endTime: run.endTime,
    tags: run.tags,
    metadata: run.metadata,
  };

  return (
    <RefCard>
      <CardHeader
        title="Raw OTLP"
        sub="JSON envelope from the OpenTelemetry collector"
        right={<RefButton size="sm" variant="outline" icon={Copy}>Copy</RefButton>}
      />
      <div className="card-pad">
        <CodeBlock style={{ maxHeight: 480 }}>{JSON.stringify(json, null, 2)}</CodeBlock>
      </div>
    </RefCard>
  );
}
