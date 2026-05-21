import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { getQueue } from "@/lib/queue";

export type OperationalEventInput = {
  projectId: string;
  eventType: string;
  title: string;
  body?: string | null;
  source: "slack" | "gmail" | "meeting" | "manual" | "ai" | "sheets" | "system";
  sourceRef?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
};

export async function appendOperationalEvent(
  supabase: SupabaseClient,
  input: OperationalEventInput
) {
  const { error } = await supabase.from("operational_events").insert({
    project_id: input.projectId,
    event_type: input.eventType,
    title: input.title,
    body: input.body ?? null,
    source: input.source,
    source_ref: input.sourceRef ?? null,
    metadata: input.metadata ?? {},
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });
  if (error) {
    logger.error("operational_events.insert_failed", { message: error.message });
    throw error;
  }
  try {
    await getQueue().enqueue({
      name: "sheets.sync",
      data: { projectId: input.projectId, reason: "operational_event" },
    });
  } catch (e) {
    logger.warn("queue.enqueue_failed", { err: String(e) });
  }
}
