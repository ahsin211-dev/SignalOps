export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcriptUploadSchema } from "@/lib/validations/api";
import { AIOperationalService } from "@/lib/ai/ai-operational-service";
import { appendOperationalEvent } from "@/server/services/operational/event-engine";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const json = await request.json();
  const parsed = transcriptUploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { title, source, text, meetingAt } = parsed.data;
  const { data: transcript, error: tErr } = await supabase
    .from("meeting_transcripts")
    .insert({
      project_id: projectId,
      title,
      source,
      raw_text: text,
      status: "processing",
      meeting_at: meetingAt ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (tErr || !transcript) {
    return NextResponse.json({ error: tErr?.message ?? "insert_failed" }, { status: 500 });
  }
  const ai = new AIOperationalService();
  const analysis = await ai.analyzeTranscript(text);
  const allowed = new Set([
    "action_item",
    "decision",
    "risk",
    "deadline",
    "milestone_update",
    "participant",
    "dependency",
  ]);
  const entities = analysis.entities.map((payload) => {
    const rawType = String(payload.type ?? "action_item");
    const entity_type = allowed.has(rawType) ? rawType : "action_item";
    return {
      transcript_id: transcript.id,
      entity_type,
      payload,
      confidence: null as number | null,
    };
  });
  if (entities.length) {
    await supabase.from("transcript_entities").insert(entities);
  }
  const { data: suggestion } = await supabase
    .from("ai_suggestions")
    .insert({
      project_id: projectId,
      suggestion_type: "meeting_summary",
      title: `Meeting summary: ${title}`,
      body: { summary: analysis.summary, transcriptId: transcript.id },
      status: "pending_approval",
    })
    .select("id")
    .single();
  if (suggestion) {
    await supabase.from("approval_requests").insert({
      project_id: projectId,
      requester_id: user.id,
      entity_type: "ai_suggestion",
      entity_id: suggestion.id,
      payload: { summary: analysis.summary },
      status: "pending",
    });
  }
  await supabase
    .from("meeting_transcripts")
    .update({ status: "completed", ai_summary: { summary: analysis.summary } })
    .eq("id", transcript.id);
  await appendOperationalEvent(supabase, {
    projectId,
    eventType: "transcript_ingested",
    title: `Transcript ingested: ${title}`,
    body: analysis.summary.slice(0, 2000),
    source: "meeting",
    sourceRef: transcript.id,
    metadata: { entities: entities.length },
  });
  return NextResponse.json({ ok: true, transcriptId: transcript.id });
}
