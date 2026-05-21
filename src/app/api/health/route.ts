import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "signalops", ts: new Date().toISOString() });
}
