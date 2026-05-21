import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getQueue } from "@/lib/queue";

/** Gmail Pub/Sub push — verify OIDC audience in production. */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  logger.info("gmail.webhook.received", { keys: raw ? Object.keys(raw) : [] });
  await getQueue().enqueue({ name: "gmail.sync", data: { stub: true } });
  return NextResponse.json({ ok: true });
}
