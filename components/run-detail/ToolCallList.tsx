"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefBadge from "@/components/primitives/RefBadge";
import CodeBlock from "@/components/shared/CodeBlock";
import { formatDuration } from "@/lib/utils";
import { Wrench } from "lucide-react";
import type { ToolCall } from "@/types";

export default function ToolCallList({ calls }: { calls: ToolCall[] }) {
  if (calls.length === 0) {
    return (
      <RefCard>
        <div className="card-pad text-center" style={{ padding: "48px 24px", color: "hsl(var(--muted-foreground))" }}>
          No tool calls recorded for this run.
        </div>
      </RefCard>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {calls.map((c) => (
        <RefCard key={c.callId}>
          <div className="card-h">
            <div className="flex items-center gap-2">
              <RefBadge variant="tool"><Wrench size={9} /> Tool</RefBadge>
              <code className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{c.toolName}()</code>
              <RefBadge variant={c.error ? "error" : "success"} dot>{c.error ? "Error" : "OK"}</RefBadge>
            </div>
            <div className="mono tabular mute" style={{ fontSize: 11 }}>{formatDuration(c.latencyMs)}</div>
          </div>
          <div className="card-pad flex flex-col gap-2">
            <div>
              <div className="mute" style={{ fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>arguments</div>
              <CodeBlock>{c.args || "—"}</CodeBlock>
            </div>
            <div>
              <div className="mute" style={{ fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>result</div>
              <CodeBlock>{c.result || c.error || "—"}</CodeBlock>
            </div>
          </div>
        </RefCard>
      ))}
    </div>
  );
}
