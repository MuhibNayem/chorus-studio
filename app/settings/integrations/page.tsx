"use client";

import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import CodeBlock from "@/components/shared/CodeBlock";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import {
  Cpu,
  Layers,
  Terminal,
  Copy,
  CheckCircle,
  FileCode,
  Shield,
  Server
} from "lucide-react";

export default function IntegrationsPage() {
  const [selectedLang, setSelectedLang] = useState<"python" | "node" | "java">("python");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const pythonSnippets = {
    langchain: `import os
from langchain_openai import ChatOpenAI
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanProcessor

# Configure Ingestion Headers
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = "Authorization=Bearer chs_prod_8f3c61cc"
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "http://localhost:8080/v1/traces"

# Chorus automatic trace listener
from chorus.observe.sdk import ChorusTracer
ChorusTracer.instrument()

# Standard LangChain code now traces automatically
chat = ChatOpenAI(model="gpt-4o", temperature=0.7)
response = chat.invoke("What is semantic search?")`,

    llamaindex: `import os
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI

# Wire OpenTelemetry endpoint
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "http://localhost:8080/v1/traces"
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = "Authorization=Bearer chs_prod_8f3c61cc"

from chorus.observe.instrumentation.llamaindex import ChorusLlamaIndexInstrumentor
ChorusLlamaIndexInstrumentor().instrument()

# Auto-instrumented index querying
Settings.llm = OpenAI(model="gpt-4o")
# LlamaIndex query flows will be logged in Chorus`,

    litellm: `# Chorus dynamic model gateway integration
from litellm import completion

# Routing OpenAI calls through Chorus Proxy
response = completion(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "hello"}],
    api_base="http://localhost:8080/api/v1/proxy",
    headers={"Authorization": "Bearer chs_prod_8f3c61cc"}
)`
  };

  const nodeSnippets = {
    standard: `import { ChorusTracer } from '@chorus/observe-sdk';

const tracer = new ChorusTracer({
  apiKey: 'chs_prod_8f3c61cc',
  endpoint: 'http://localhost:8080/v1/traces',
  projectName: 'customer-support-agent'
});

// Wrap agent runs with dynamic tracer contexts
await tracer.traceRun('ag_router', async (run) => {
  const result = await model.call({ prompt: 'Hello!' });
  run.logLlmCall('gpt-4o', { input: 'Hello!', output: result });
  return result;
});`,
    openai: `import OpenAI from 'openai';
import { instrumentOpenAI } from '@chorus/observe-sdk/openai';

const openai = new OpenAI({
  apiKey: 'YOUR_OPENAI_KEY',
  baseURL: 'http://localhost:8080/api/v1/proxy',
  defaultHeaders: {
    'Authorization': 'Bearer chs_prod_8f3c61cc'
  }
});

// Auto-traces parameters and cost estimates
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'hello' }],
});`
  };

  const javaSnippets = {
    properties: `# Configure OpenTelemetry tracing targets
otel.exporter.otlp.endpoint=http://localhost:8080
otel.exporter.otlp.headers=Authorization=Bearer chs_prod_8f3c61cc
otel.resource.attributes=service.name=customer-agent-prod

# Chorus Observe Auto-Configuration overrides
chorus.observe.storage.span-store=dual
chorus.observe.ingestion-queue.enabled=true
chorus.observe.sampler.strategy=tail-based
chorus.observe.rate-limit.enabled=true`
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      <PageHeader
        title="Developer Integrations"
        accent="/ SDKs"
        sub="Integrate any LLM framework or agent architecture in under 5 minutes using open-source OpenTelemetry hooks."
        actions={
          <div className="flex gap-2">
            <RefButton
              variant={selectedLang === "python" ? "primary" : "outline"}
              icon={FileCode}
              onClick={() => setSelectedLang("python")}
            >
              Python
            </RefButton>
            <RefButton
              variant={selectedLang === "node" ? "primary" : "outline"}
              icon={Terminal}
              onClick={() => setSelectedLang("node")}
            >
              JavaScript / TS
            </RefButton>
            <RefButton
              variant={selectedLang === "java" ? "primary" : "outline"}
              icon={Server}
              onClick={() => setSelectedLang("java")}
            >
              Java / Spring
            </RefButton>
          </div>
        }
      />

      {/* Dynamic Carousel Snippets based on selected language */}
      {selectedLang === "python" && (
        <div className="space-y-6">
          <div className="split-2 gap-6">
            <RefCard>
              <CardHeader title="LangChain Auto-Tracing" sub="Trace complex multi-chain execution graphs." />
              <div className="card-pad space-y-4">
                <div className="relative">
                  <button
                    onClick={() => handleCopy("lc", pythonSnippets.langchain)}
                    className="absolute right-2 top-2 border p-1 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {copied === "lc" ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                  <CodeBlock style={{ fontSize: 11, maxHeight: 350, overflowY: "auto" }}>
                    {pythonSnippets.langchain}
                  </CodeBlock>
                </div>
              </div>
            </RefCard>

            <RefCard>
              <CardHeader title="LlamaIndex RAG Logging" sub="Track document parsing, embedding steps, and retrieval hits." />
              <div className="card-pad space-y-4">
                <div className="relative">
                  <button
                    onClick={() => handleCopy("li", pythonSnippets.llamaindex)}
                    className="absolute right-2 top-2 border p-1 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {copied === "li" ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                  <CodeBlock style={{ fontSize: 11, maxHeight: 350, overflowY: "auto" }}>
                    {pythonSnippets.llamaindex}
                  </CodeBlock>
                </div>
              </div>
            </RefCard>
          </div>

          <RefCard>
            <CardHeader title="LiteLLM Gateway Proxies" sub="Route LLM API requests and manage project keys." />
            <div className="card-pad">
              <div className="relative">
                <button
                  onClick={() => handleCopy("lite", pythonSnippets.litellm)}
                  className="absolute right-2 top-2 border p-1 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {copied === "lite" ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
                <CodeBlock style={{ fontSize: 11, maxHeight: 200, overflowY: "auto" }}>
                  {pythonSnippets.litellm}
                </CodeBlock>
              </div>
            </div>
          </RefCard>
        </div>
      )}

      {selectedLang === "node" && (
        <div className="split-2 gap-6">
          <RefCard>
            <CardHeader title="JavaScript SDK integration" sub="Standard manual tracing wrapper." />
            <div className="card-pad space-y-4">
              <div className="relative">
                <button
                  onClick={() => handleCopy("js_std", nodeSnippets.standard)}
                  className="absolute right-2 top-2 border p-1 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {copied === "js_std" ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
                <CodeBlock style={{ fontSize: 11, maxHeight: 350, overflowY: "auto" }}>
                  {nodeSnippets.standard}
                </CodeBlock>
              </div>
            </div>
          </RefCard>

          <RefCard>
            <CardHeader title="OpenAI API Wrapper" sub="Intercept OpenAI client requests for token/cost logging." />
            <div className="card-pad space-y-4">
              <div className="relative">
                <button
                  onClick={() => handleCopy("js_oa", nodeSnippets.openai)}
                  className="absolute right-2 top-2 border p-1 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {copied === "js_oa" ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
                <CodeBlock style={{ fontSize: 11, maxHeight: 350, overflowY: "auto" }}>
                  {nodeSnippets.openai}
                </CodeBlock>
              </div>
            </div>
          </RefCard>
        </div>
      )}

      {selectedLang === "java" && (
        <RefCard>
          <CardHeader title="Spring Boot configuration" sub="Add properties setup to auto-route standard OpenTelemetry outputs." />
          <div className="card-pad">
            <div className="relative">
              <button
                onClick={() => handleCopy("java_prop", javaSnippets.properties)}
                className="absolute right-2 top-2 border p-1 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {copied === "java_prop" ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
              </button>
              <CodeBlock style={{ fontSize: 11, maxHeight: 260, overflowY: "auto" }}>
                {javaSnippets.properties}
              </CodeBlock>
            </div>
          </div>
        </RefCard>
      )}
    </div>
  );
}
