import { logger } from "@/lib/logger";
import type { JobPayload, QueuePort } from "./types";

/** Dev-friendly queue: processes jobs on next tick (no durability). */
export class InMemoryQueue implements QueuePort {
  async enqueue(job: JobPayload): Promise<void> {
    logger.info("queue.in_memory.enqueue", { job: job.name, id: job.id });
    setTimeout(() => {
      logger.info("queue.in_memory.processed_stub", { job: job.name });
    }, 0);
  }
}
