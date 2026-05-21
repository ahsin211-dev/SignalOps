import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { verifySlackSignature, handleSlackEventPayload } from "@/server/services/integrations/slack-processing";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getQueue } from "@/lib/queue";

export async function POST(request: Request) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
  const signature = request.headers.get("x-slack-signature") ?? "";
  if (!signingSecret) {
    logger.warn("slack.webhook.missing_signing_secret");
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  if (!verifySlackSignature({ signingSecret, rawBody, timestamp, signature })) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  const payload = JSON.parse(rawBody);
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = await createServiceRoleClient();
      await handleSlackEventPayload(supabase, payload);
    } else {
      logger.warn("slack.webhook.no_service_role", { note: "Skipping DB fan-out" });
    }
    await getQueue().enqueue({ name: "slack.event", data: { team_id: payload.team_id }, id: payload.event_id });
  } catch (e) {
    logger.error("slack.webhook.handler_error", { err: String(e) });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
