import { BullmqQueue } from "./bullmq-adapter";
import { InMemoryQueue } from "./in-memory-queue";
import type { QueuePort } from "./types";

let singleton: QueuePort | null = null;

export function getQueue(): QueuePort {
  if (singleton) return singleton;
  const redis = process.env.REDIS_URL;
  if (redis) {
    singleton = new BullmqQueue(redis);
  } else {
    singleton = new InMemoryQueue();
  }
  return singleton;
}
