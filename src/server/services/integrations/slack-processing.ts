import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

export function verifySlackSignature(args: {
  signingSecret: string;
  rawBody: string;
  timestamp: string;
  signature: string;
}): boolean {
  const base = `v0:${args.timestamp}:${args.rawBody}`;
  const hmac = createHmac("sha256", args.signingSecret).update(base).digest("hex");
  const expected = `v0=${hmac}`;
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(args.signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function handleSlackEventPayload(
  _supabase: SupabaseClient,
  payload: { type?: string; event?: { type?: string; channel?: string; text?: string; ts?: string } }
) {
  if (payload.type !== "event_callback" || !payload.event) {
    return { ok: true };
  }
  const ev = payload.event;
  logger.info("slack.event.received", { type: ev.type });
  /* Channel → project mapping should be resolved via slack_channel_mappings in production */
  return { ok: true };
}
