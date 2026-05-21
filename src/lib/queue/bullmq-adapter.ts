import { Queue } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@/lib/logger";
import type { JobPayload, QueuePort } from "./types";

export class BullmqQueue implements QueuePort {
  private queue: Queue;

  constructor(connectionString: string) {
    const connection = new IORedis(connectionString, { maxRetriesPerRequest: null });
    this.queue = new Queue("signalops", { connection });
  }

  async enqueue(job: JobPayload): Promise<void> {
    await this.queue.add(job.name, job.data, { jobId: job.id });
    logger.info("queue.bullmq.enqueue", { job: job.name });
  }
}
