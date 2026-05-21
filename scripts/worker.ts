import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../src/lib/logger";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  logger.error("worker.missing_redis");
  process.exit(1);
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

new Worker(
  "signalops",
  async (job) => {
    logger.info("worker.job", { name: job.name, id: job.id });
    /* Wire domain handlers: slack.event, gmail.sync, sheets.sync, transcript.analyze */
  },
  { connection }
);

logger.info("worker.started", {});
