"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import TopModels from "@/components/overview/TopModels";
import { api } from "@/lib/api";
import type { ModelMetrics } from "@/types";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listModels()
      .then((res) => setModels(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Models" sub="Cost, latency, and volume by model." />
      <TopModels models={models} />
    </div>
  );
}
