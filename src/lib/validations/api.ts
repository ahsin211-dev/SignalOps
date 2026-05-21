import { z } from "zod";

export const uuid = z.string().uuid();

export const approvalDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(2000).optional(),
});

export const transcriptUploadSchema = z.object({
  title: z.string().min(1).max(500),
  source: z.enum(["zoom", "google_meet", "plaintext"]),
  text: z.string().min(1).max(500_000),
  meetingAt: z.string().optional(),
});
