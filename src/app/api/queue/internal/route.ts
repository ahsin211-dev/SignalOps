import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/** Example internal job runner hook — protect with `INTERNAL_JOB_SECRET` in production. */
export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (!process.env.INTERNAL_JOB_SECRET || secret !== process.env.INTERNAL_JOB_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  logger.info("queue.internal.tick", body);
  return NextResponse.json({ ok: true });
}
