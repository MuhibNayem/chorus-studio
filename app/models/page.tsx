"use client";

import PageHeader from "@/components/shared/PageHeader";
import TopModels from "@/components/overview/TopModels";

const MOCK_MODELS = [
  { model: "gpt-4o-mini", provider: "openai", runs: 71_240, tokens: 2.1e6, cost: 41.20 },
  { model: "claude-3-5-sonnet", provider: "anthropic", runs: 24_810, tokens: 1.8e6, cost: 184.20 },
  { model: "gpt-4o", provider: "openai", runs: 18_240, tokens: 0.81e6, cost: 38.42 },
  { model: "gemini-2.0-flash", provider: "google", runs: 8_240, tokens: 0.21e6, cost: 6.18 },
];

export default function ModelsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Models" sub="Cost, latency, and volume by model." />
      <TopModels models={MOCK_MODELS} />
    </div>
  );
}
