"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function TranscriptUploader({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState("Weekly sync");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/transcripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, source: "plaintext", text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success("Transcript ingested");
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border bg-card/40 p-4">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="text">Transcript</Label>
        <textarea
          id="text"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[180px] w-full rounded-md border border-border bg-secondary/40 p-3 text-sm"
          placeholder="Paste Zoom / Meet / plaintext transcript"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Processing…" : "Ingest & analyze"}
      </Button>
    </form>
  );
}
