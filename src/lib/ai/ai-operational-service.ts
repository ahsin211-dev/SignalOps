import { logger } from "@/lib/logger";
import { createOpenAIProvider, runProjectInsights } from "./openai-provider";

/**
 * Human-in-the-loop AI layer: proposes analysis only.
 */
export class AIOperationalService {
  async analyzeTranscript(text: string) {
    const provider = createOpenAIProvider();
    if (!provider) {
      logger.warn("ai.disabled", { reason: "OPENAI_API_KEY missing" });
      return {
        summary: "AI analysis unavailable (configure OPENAI_API_KEY).",
        entities: [] as Record<string, unknown>[],
      };
    }
    const summary = await provider.summarize(text);
    const structured = await provider.completeJson<{
      action_items: { title: string; owner?: string }[];
      decisions: { text: string }[];
      risks: { text: string; severity: string }[];
      deadlines: { text: string }[];
    }>({
      system:
        'Extract operational entities as JSON with keys action_items[], decisions[], risks[], deadlines[]. Each item minimal fields. No execution instructions.',
      user: text.slice(0, 120_000),
    });
    const entities: Record<string, unknown>[] = [
      ...(structured.action_items ?? []).map((x) => ({ type: "action_item", ...x })),
      ...(structured.decisions ?? []).map((x) => ({ type: "decision", ...x })),
      ...(structured.risks ?? []).map((x) => ({ type: "risk", ...x })),
      ...(structured.deadlines ?? []).map((x) => ({ type: "deadline", ...x })),
    ];
    return { summary, entities };
  }

  async milestoneRisk(milestoneContext: string) {
    return runProjectInsights(milestoneContext);
  }
}
