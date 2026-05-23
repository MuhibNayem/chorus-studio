"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DatasetsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Datasets</h2>
        <p className="text-muted-foreground">Manage evaluation datasets from production traces.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 3</CardTitle>
          <CardDescription>
            Dataset creation from traces, versioning, annotation, and export will be available in the Evaluation Engine phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Planned features:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Create datasets from production traces (select runs → extract I/O → create items)</li>
            <li>Import from JSON/JSONL (LangSmith export format supported)</li>
            <li>Manual creation with form-based item editor</li>
            <li>Train/test/validation split management</li>
            <li>Version history with immutable snapshots</li>
            <li>Semantic deduplication via pgvector cosine distance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
