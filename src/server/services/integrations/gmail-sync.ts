import { logger } from "@/lib/logger";

/** Gmail ingestion & parsing — wire to googleapis with stored refresh tokens. */
export class GmailSyncService {
  async syncMailbox(args: { userId: string }) {
    void args.userId;
    logger.info("gmail.sync.stub", {});
  }
}
