import { logger } from "@/lib/logger";

/**
 * Google Sheets operational memory (optional).
 *
 * ARCHITECTURAL WARNING (MVP):
 * - Sheets works well for human-readable operational mirrors and lightweight clients.
 * - Concurrency, cell-level conflicts, API quotas, and audit granularity are weaker than a relational store.
 * - Plan an eventual migration to Postgres-first operational memory (this schema) with Sheets as export-only.
 */
export class GoogleSheetsSyncService {
  async pushProjectSnapshot(args: { spreadsheetId: string; rows: (string | number | null)[][] }) {
    void args;
    logger.info("sheets.sync.push_stub", { note: "Implement with googleapis + OAuth tokens per workspace" });
  }

  async pullChanges(args: { spreadsheetId: string }) {
    void args;
    logger.info("sheets.sync.pull_stub", {});
    return { version: 0, rows: [] as (string | number | null)[][] };
  }
}
