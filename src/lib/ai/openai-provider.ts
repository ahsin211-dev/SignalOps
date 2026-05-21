import OpenAI from "openai";
import type { AIProvider, AIChatMessage, OperationalInsight } from "./types";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async summarize(text: string): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are SignalOps, an operational intelligence assistant. Summarize clearly for project managers. No autonomous actions.",
        },
        { role: "user", content: text.slice(0, 120_000) },
      ],
      temperature: 0.2,
    });
    return res.choices[0]?.message?.content?.trim() ?? "";
  }

  async completeJson<T>(params: { system: string; user: string }): Promise<T> {
    const res = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ] as AIChatMessage[],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw) as T;
  }

  async projectInsights(context: string): Promise<OperationalInsight[]> {
    const data = await this.completeJson<{ items: OperationalInsight[] }>({
      system:
        "Return JSON { items: [{ headline, details, confidence 0-1 }] } for PM operational insights. Human must approve actions — do not instruct autonomous execution.",
      user: context.slice(0, 120_000),
    });
    return data.items ?? [];
  }
}

export async function runProjectInsights(context: string): Promise<OperationalInsight[]> {
  const provider = createOpenAIProvider();
  if (!provider) return [];
  return await (provider as OpenAIProvider).projectInsights(context);
}

export function createOpenAIProvider(): AIProvider | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAIProvider(key);
}
