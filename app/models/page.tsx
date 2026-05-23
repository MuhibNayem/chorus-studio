"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import TopModels from "@/components/overview/TopModels";
import { api } from "@/lib/api";
import type { ModelMetrics } from "@/types";

const MOCK_MODELS: ModelMetrics[] = [
  { model: "gpt-4o-mini", provider: "openai", runs: 71_240, tokens: 2_100_000, cost: 41.20 },
  { model: "claude-3-5-sonnet", provider: "anthropic", runs: 24_810, tokens: 1_800_000, cost: 184.20 },
  { model: "gpt-4o", provider: "openai", runs: 18_240, tokens: 810_000, cost: 38.42 },
  { model: "gemini-2.0-flash", provider: "google", runs: 8_240, tokens: 210_000, cost: 6.18 },
];

export default function ModelsPage() {
  const [models, setModels] = useState<ModelMetrics[]>(MOCK_MODELS);

  useEffect(() => {
    api.listModels()
      .then((res) => setModels(res.length > 0 ? res : MOCK_MODELS))
      .catch(() => setModels(MOCK_MODELS));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Models" sub="Cost, latency, and volume by model." />
      <TopModels models={models} />
    </div>
  );
}
