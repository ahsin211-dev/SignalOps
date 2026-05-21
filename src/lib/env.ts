import { z } from "zod";

const server = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  INTERNAL_JOB_SECRET: z.string().optional(),
});

const client = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
});

function parseEnv() {
  const merged = { ...process.env };
  const c = client.safeParse(merged);
  const s = server.safeParse(merged);
  return {
    client: c.success ? c.data : ({} as z.infer<typeof client>),
    server: s.success ? s.data : ({} as z.infer<typeof server>),
  };
}

export const env = parseEnv();

export function requireEnv(name: keyof NodeJS.ProcessEnv): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${String(name)}`);
  return v;
}
