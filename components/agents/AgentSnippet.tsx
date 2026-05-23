"use client";

import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import CodeBlock from "@/components/shared/CodeBlock";
import { Copy } from "lucide-react";

export default function AgentSnippet({ agent }: { agent: { id: string; framework: string; version: string } }) {
  const code = `// Send OTLP traces from ${agent.framework}
import { ChorusObserve } from '@chorus/observe';

const observe = new ChorusObserve({
  endpoint: 'https://otlp.chorus.observe/v1/traces',
  projectToken: process.env.CHORUS_TOKEN,
});

observe.instrument({
  agentId: '${agent.id}',
  framework: '${agent.framework.toLowerCase()}',
  version: '${agent.version}',
});`;

  return (
    <RefCard>
      <CardHeader title="Integration" sub="Drop this in your agent runtime"
        right={<RefButton size="sm" variant="outline" icon={Copy}>Copy</RefButton>}
      />
      <div className="card-pad">
        <CodeBlock style={{ maxHeight: "none" }}>{code}</CodeBlock>
      </div>
    </RefCard>
  );
}
