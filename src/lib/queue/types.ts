export type JobName =
  | "slack.event"
  | "gmail.sync"
  | "sheets.sync"
  | "transcript.analyze"
  | "reminder.dispatch";

export type JobPayload = {
  name: JobName;
  data: Record<string, unknown>;
  id?: string;
};

export interface QueuePort {
  enqueue(job: JobPayload): Promise<void>;
}
