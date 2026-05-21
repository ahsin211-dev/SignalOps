export type AIChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  completeJson<T>(params: {
    system: string;
    user: string;
    schemaHint?: string;
  }): Promise<T>;
  summarize(text: string): Promise<string>;
}

export type OperationalInsight = {
  headline: string;
  details: string;
  confidence: number;
};
