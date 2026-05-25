"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import { RefCard, CardHeader } from "@/components/primitives/RefCard";
import RefButton from "@/components/primitives/RefButton";
import RefBadge from "@/components/primitives/RefBadge";
import CodeBlock from "@/components/shared/CodeBlock";
import FormField from "@/components/shared/FormField";
import { ArrowLeft, ArrowRight, Check, Copy, RefreshCw, PlayCircle, HelpCircle, Server, X as XIcon } from "lucide-react";
import { Select } from "@/components/ui/select";

const FRAMEWORKS = [
  { id: "chorus", name: "Chorus Engine", sub: "chorus-engine4j", snippet: "chorus" },
  { id: "langgraph", name: "LangGraph", sub: "langgraph 0.4", snippet: "langgraph" },
  { id: "langchain", name: "LangChain", sub: "langchain-core 0.3", snippet: "langchain" },
  { id: "llamaidx", name: "LlamaIndex", sub: "llama-index 0.12", snippet: "llamaidx" },
  { id: "crewai", name: "CrewAI", sub: "crewai 0.8", snippet: "crewai" },
  { id: "custom", name: "Custom", sub: "Direct OTLP via SDK", snippet: "otlp" },
];

export default function AgentRegisterWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", id: "", description: "", framework: "chorus", owner: "platform", tags: [] as string[], sampleRate: 100,
  });
  const [tagInput, setTagInput] = useState("");
  const [pinging, setPinging] = useState(false);
  const [connected, setConnected] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const addTag = (t?: string) => {
    const v = (t || tagInput).trim();
    if (!v || form.tags.includes(v)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, v] }));
    setTagInput("");
  };
  const removeTag = (t: string) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  useEffect(() => {
    if (step === 1 && !form.id && form.name) {
      const id = "ag_" + form.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
      if (id !== "ag_") set("id", id);
    }
  }, [form.name, step, form.id]);

  const fw = FRAMEWORKS.find((f) => f.id === form.framework);

  const codeSnippets: Record<string, string> = {
    chorus: `# Python — Chorus Engine\nfrom chorus import Agent, Tracer\n\ntracer = Tracer(\n    project_token="<CHORUS_TOKEN>",\n    agent_id="${form.id || "ag_my_agent"}",\n)\n\nagent = Agent(name="${form.name || "my-agent"}", tracer=tracer)\nagent.run("Hello, world.")`,
    langgraph: `# Python — LangGraph + OTLP\nfrom opentelemetry import trace\nfrom opentelemetry.sdk.trace import TracerProvider\nfrom opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter\nfrom langgraph.graph import StateGraph\n\ntrace.set_tracer_provider(TracerProvider(resource=Resource.create({\n  "agent.id":        "${form.id || "ag_my_agent"}",\n  "agent.framework": "langgraph",\n})))\ntrace.get_tracer_provider().add_span_processor(BatchSpanProcessor(\n  OTLPSpanExporter(endpoint="https://otlp.chorus.observe/v1/traces",\n                   headers={"chorus-token": "<CHORUS_TOKEN>"})\n))`,
    langchain: `# Python — LangChain\nimport os\nos.environ["CHORUS_TOKEN"]    = "<CHORUS_TOKEN>"\nos.environ["CHORUS_AGENT_ID"] = "${form.id || "ag_my_agent"}"\n\nfrom chorus.langchain import attach_callbacks\nfrom langchain_openai import ChatOpenAI\n\nllm = ChatOpenAI(model="gpt-4o-mini",\n                 callbacks=attach_callbacks(framework="langchain"))`,
    llamaidx: `# Python — LlamaIndex\nfrom llama_index.core import set_global_handler\nset_global_handler("chorus", project_token="<CHORUS_TOKEN>",\n                   agent_id="${form.id || "ag_my_agent"}")`,
    crewai: `# Python — CrewAI\nfrom chorus.crewai import instrument\ninstrument(project_token="<CHORUS_TOKEN>",\n           agent_id="${form.id || "ag_my_agent"}")`,
    otlp: `# Direct OTLP — any language\ncurl -X POST https://otlp.chorus.observe/v1/traces \\\n  -H "chorus-token: <CHORUS_TOKEN>" \\\n  -H "content-type: application/json" \\\n  -d '{\n    "resourceSpans": [{\n      "resource": { "attributes": [\n        { "key": "agent.id", "value": { "stringValue": "${form.id || "ag_my_agent"}" } }\n      ]},\n      "scopeSpans": [{ "spans": [...] }]\n    }]\n  }'`,
  };

  const code = codeSnippets[form.framework] || codeSnippets.otlp;
  const canStep2 = form.name.trim() && form.id.trim();

  const handlePing = () => {
    setPinging(true);
    setTimeout(() => { setPinging(false); setConnected(true); }, 1800);
  };

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 1080 }}>
      <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ cursor: "pointer", width: "fit-content" }}>
        <ArrowLeft size={13} /> Agents
      </Link>

      <PageHeader title="Register agent" sub="Get a new agent emitting traces into Chorus Observe." />

      {/* Stepper */}
      <div className="flex items-center gap-0" style={{ marginBottom: 22 }}>
        {[
          ["Identity", "1"],
          ["Framework", "2"],
          ["Verify", "3"],
        ].map(([lbl, n], i, arr) => {
          const idx = i + 1;
          const done = idx < step, active = idx === step;
          return (
            <div key={lbl} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2" style={{ opacity: idx > step ? 0.5 : 1, cursor: idx <= step ? "pointer" : "default" }}
                onClick={() => idx <= step && setStep(idx)}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: done ? "hsl(var(--success))" : active ? "hsl(var(--primary))" : "transparent",
                  border: active || done ? "none" : "1px solid hsl(var(--border-bright))",
                  color: done || active ? "white" : "hsl(var(--muted-foreground))",
                  display: "grid", placeItems: "center",
                  fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                }}>
                  {done ? <Check size={13} /> : n}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                  {lbl}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, height: 1, background: "hsl(var(--border))", position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    background: "hsl(var(--success))",
                    width: idx < step ? "100%" : "0%",
                    transition: "width 200ms ease",
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="split-2">
        {/* Step 1: Identity */}
        {step === 1 && (
          <RefCard>
            <CardHeader title="Identity" sub="What this agent is called, who owns it" />
            <div className="card-pad flex flex-col gap-4">
              <FormField label="Display name" hint="A human-readable name. Shows up in lists and breadcrumbs.">
                <input className="ref-input" placeholder="Observability Copilot"
                  value={form.name} onChange={(e) => set("name", e.target.value)} />
              </FormField>
              <FormField label="Agent ID" hint="Stable identifier emitted on every span. Cannot change later.">
                <input className="ref-input" placeholder="ag_observability_copilot"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                  value={form.id}
                  onChange={(e) => set("id", e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())} />
              </FormField>
              <FormField label="Description" hint="One line — what the agent does.">
                <textarea className="ref-input" rows={2}
                  style={{ height: "auto", padding: 10, resize: "vertical", fontFamily: "var(--font-sans)", fontSize: 13 }}
                  placeholder="Answers questions about agent traces, costs, and guardrails."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Owner team">
                  <Select
                    value={form.owner}
                    onChange={(v) => set("owner", v as string)}
                    options={[
                      { value: "platform", label: "platform" },
                      { value: "research", label: "research" },
                      { value: "safety", label: "safety" },
                      { value: "growth", label: "growth" },
                    ]}
                  />
                </FormField>
                <FormField label="Sampling rate" hint="% of runs to ingest.">
                  <div className="flex items-center gap-2">
                    <input type="range" min="1" max="100" value={form.sampleRate}
                      onChange={(e) => set("sampleRate", +e.target.value)}
                      style={{ flex: 1, accentColor: "hsl(var(--primary))" }} />
                    <span className="mono tabular" style={{ minWidth: 38, fontSize: 13, fontWeight: 600 }}>
                      {form.sampleRate}%
                    </span>
                  </div>
                </FormField>
              </div>
              <FormField label="Tags" hint="Press enter to add.">
                <div className="flex flex-wrap gap-1.5" style={{
                  padding: 6, border: "1px solid hsl(var(--border)/0.35)",
                  borderRadius: "0.375rem", background: "hsl(var(--card))", minHeight: 36,
                }}>
                  {form.tags.map((t) => (
                    <span key={t} className="filter-chip active" style={{ cursor: "default" }}>
                      {t}
                      <button onClick={() => removeTag(t)} style={{ marginLeft: 2, opacity: 0.7 }}>
                        <XIcon size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    style={{ flex: 1, minWidth: 80, border: 0, outline: "none", background: "transparent",
                      fontSize: 12, padding: "0 4px", color: "hsl(var(--foreground))" }}
                    placeholder={form.tags.length === 0 ? "copilot, internal…" : ""}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                      else if (e.key === "Backspace" && !tagInput && form.tags.length) {
                        removeTag(form.tags[form.tags.length - 1]);
                      }
                    }}
                  />
                </div>
              </FormField>
            </div>
            <div className="card-h" style={{ borderTop: "1px solid hsl(var(--border))", borderBottom: "none" }}>
              <Link href="/agents">
                <RefButton variant="ghost">Cancel</RefButton>
              </Link>
              <RefButton variant="primary" disabled={!canStep2} onClick={() => setStep(2)}>
                Continue <ArrowRight size={13} />
              </RefButton>
            </div>
          </RefCard>
        )}

        {/* Step 2: Framework */}
        {step === 2 && (
          <RefCard>
            <CardHeader title="Framework" sub="How traces will reach Chorus Observe" />
            <div className="card-pad flex flex-col gap-4">
              <FormField label="Pick your stack">
                <div className="grid grid-cols-2 gap-2">
                  {FRAMEWORKS.map((f) => (
                    <button key={f.id}
                      onClick={() => set("framework", f.id)}
                      className="text-left cursor-pointer transition-all"
                      style={{
                        padding: "12px 14px",
                        borderRadius: "0.375rem",
                        border: `1px solid hsl(var(--${form.framework === f.id ? "primary" : "border"}) / ${form.framework === f.id ? 0.6 : 1})`,
                        background: form.framework === f.id ? "hsl(var(--primary) / 0.08)" : "hsl(var(--card))",
                      }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 13, fontWeight: 600,
                          color: form.framework === f.id ? "hsl(var(--primary-bright))" : "hsl(var(--foreground))" }}>{f.name}</span>
                        {form.framework === f.id && <Check size={13} style={{ color: "hsl(var(--primary-bright))" }} />}
                      </div>
                      <div className="mute mono" style={{ fontSize: 10.5, marginTop: 4 }}>{f.sub}</div>
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Generated project token" hint="Use this in your CHORUS_TOKEN env var.">
                <div className="flex items-center gap-1.5">
                  <input className="ref-input" readOnly
                    style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "hsl(var(--muted-foreground))" }}
                    value={`chs_dev_${(form.id || "agent").slice(0, 8)}_${Math.random().toString(36).slice(2, 10)}`} />
                  <RefButton variant="outline" size="sm" icon={Copy}>Copy</RefButton>
                  <RefButton variant="ghost" size="sm" icon={RefreshCw}>Rotate</RefButton>
                </div>
              </FormField>
            </div>
            <div className="card-h" style={{ borderTop: "1px solid hsl(var(--border))", borderBottom: "none" }}>
              <RefButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>Back</RefButton>
              <RefButton variant="primary" onClick={() => setStep(3)}>
                Continue <ArrowRight size={13} />
              </RefButton>
            </div>
          </RefCard>
        )}

        {/* Step 3: Verify */}
        {step === 3 && (
          <RefCard>
            <CardHeader title="Verify" sub="Once your agent emits its first span we'll confirm here." />
            <div className="card-pad flex flex-col gap-3">
              <div className="flex items-start gap-3" style={{
                padding: "14px 16px",
                background: connected ? "hsl(var(--success) / 0.1)" : "hsl(var(--card-elev))",
                border: `1px solid hsl(var(--${connected ? "success" : "border"}) / ${connected ? 0.4 : 1})`,
                borderRadius: "0.375rem",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: connected ? "hsl(var(--success))" : "hsl(var(--muted) / 0.5)",
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  {connected ? <Check size={16} color="white" />
                    : pinging ? <RefreshCw size={16} className="mute animate-spin" />
                    : <Server size={16} className="mute" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {connected ? "First trace received — agent is live." :
                     pinging ? "Listening for the first OTLP span…" :
                     "Waiting for traces."}
                  </div>
                  <div className="mute" style={{ fontSize: 11.5, marginTop: 4 }}>
                    {connected ? `${form.id} now appears in the Agents list and starts collecting metrics.`
                              : "Run the snippet on the right against this workspace."}
                  </div>
                </div>
                {!connected && (
                  <RefButton variant="outline" size="sm" disabled={pinging}
                    onClick={handlePing} icon={pinging ? RefreshCw : PlayCircle}>
                    {pinging ? "Listening…" : "Test connection"}
                  </RefButton>
                )}
              </div>

              <FormField label="Summary">
                <div className="kv-grid" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                  <div className="k">name</div><div className="v">{form.name || "—"}</div>
                  <div className="k">id</div><div className="v">{form.id || "—"}</div>
                  <div className="k">framework</div><div className="v">{fw?.name}</div>
                  <div className="k">owner</div><div className="v">{form.owner}</div>
                  <div className="k">sampling</div><div className="v">{form.sampleRate}%</div>
                  <div className="k">tags</div><div className="v">{form.tags.join(", ") || "—"}</div>
                </div>
              </FormField>
            </div>
            <div className="card-h" style={{ borderTop: "1px solid hsl(var(--border))", borderBottom: "none" }}>
              <RefButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(2)}>Back</RefButton>
              <Link href="/agents">
                <RefButton variant="primary" icon={Check} disabled={!connected}>
                  Finish & view agents
                </RefButton>
              </Link>
            </div>
          </RefCard>
        )}

        {/* Right column: snippet + help */}
        <div className="flex flex-col gap-4">
          <RefCard>
            <div className="card-h">
              <div>
                <div className="card-title"><span className="h-bullet" />Integration snippet</div>
                <div className="card-sub">Live preview · updates as you fill in the form</div>
              </div>
              <RefButton size="sm" variant="outline" icon={Copy}>Copy</RefButton>
            </div>
            <div style={{ padding: 0 }}>
              <CodeBlock style={{ maxHeight: 360, borderRadius: 0, border: 0, borderTop: "1px solid hsl(var(--border)/0.3)", margin: 0 }}>
                {code}
              </CodeBlock>
            </div>
          </RefCard>

          <RefCard>
            <div className="card-pad flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <HelpCircle size={14} style={{ color: "hsl(var(--primary-bright))" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>How sampling works</span>
              </div>
              <div className="mute" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
                At 100% Chorus ingests every span this agent produces. Lower values
                pick traces uniformly at random — guardrail spans are always kept,
                and any span marked <code className="mono">error</code> bypasses the sampler.
              </div>
            </div>
          </RefCard>
        </div>
      </div>
    </div>
  );
}
