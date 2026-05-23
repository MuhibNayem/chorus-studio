"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure Chorus Studio connection and preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Connection</CardTitle>
          <CardDescription>Chorus Observe server endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Server URL</label>
            <Input defaultValue={process.env.CHORUS_API_URL || "http://localhost:8080"} disabled />
            <p className="text-xs text-muted-foreground">
              Set via <code className="bg-muted px-1 rounded">CHORUS_API_URL</code> environment variable.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Chorus Studio v1.0.0</p>
          <p>Part of the Chorus Observe platform.</p>
          <p>
            <a href="https://github.com/MuhibNayem/chorus-engine4j" className="text-primary hover:underline" target="_blank" rel="noreferrer">
              github.com/MuhibNayem/chorus-engine4j
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
