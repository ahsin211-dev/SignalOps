import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

/** Schedules and dispatches reminders (in-app, email, Slack) — wire to cron + queue in production. */
export class ReminderEngine {
  constructor(private readonly supabase: SupabaseClient) {}

  async scanDueReminders() {
    logger.info("reminder_engine.scan_stub", {});
    void this.supabase;
  }
}
