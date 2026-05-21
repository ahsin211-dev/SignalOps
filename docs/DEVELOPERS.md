# SignalOps — developer guide

This document explains **what the product does in code**, how the repository is **structured**, which **modules** matter, and what you need to **understand before changing things safely**.

For install steps, see [Setup](./SETUP.md). For high-level design rules, see [Architecture](./ARCHITECTURE.md).

## What SignalOps does (in this repo)

SignalOps is a **human-supervised** operational coordination surface:

- **Persistent project state** lives primarily in **Supabase Postgres** (milestones, tasks, risks, operational timeline, approvals, etc.).
- **Integrations** (Slack, Gmail, optional Sheets) are **adapters**: they ingest signals and write normalized rows and `operational_events`; they do not silently replace human decisions.
- **AI** (`src/lib/ai`) proposes summaries and structured extractions; **approvals** (`approval_requests`, server actions) gate how those proposals become durable state or outbound comms.
- **Queues** (`src/lib/queue`) decouple webhooks from heavy work: BullMQ when `REDIS_URL` is set, otherwise an in-memory stub for local dev.

If you add “automation,” keep a **human approval** or **explicit draft** step unless the change is strictly internal bookkeeping.

## Tech stack (where it lives)

| Concern | Implementation | Location |
| --- | --- | --- |
| UI & routing | Next.js App Router | `src/app/` |
| Shared UI | Tailwind + shadcn-style primitives | `src/components/ui/` |
| Auth session | Supabase SSR | `src/middleware.ts`, `src/lib/supabase/*` |
| Validation | Zod | `src/lib/validations/` |
| Domain services | Plain TS modules | `src/server/` |
| Read models / queries | Repository-style helpers | `src/server/repositories/` |
| Background jobs | BullMQ worker script | `scripts/worker.ts`, `src/lib/queue/` |
| Schema & RLS | SQL migrations | `supabase/migrations/` |

## Repository layout (mental map)

```
signalops/
├── README.md                 # Quick start + links into docs/
├── docs/
│   ├── README.md             # Documentation index
│   ├── SETUP.md              # Detailed setup & troubleshooting
│   ├── DEVELOPERS.md         # This file
│   └── ARCHITECTURE.md       # Design principles & evolution
├── supabase/
│   ├── migrations/           # Versioned SQL (run in order)
│   └── seed.sql              # Commented bootstrap examples
├── scripts/
│   └── worker.ts             # BullMQ consumer entrypoint
├── public/                   # Static assets
└── src/
    ├── app/                  # Routes: pages, layouts, API, server actions
    ├── components/         # React components (feature + layout + ui)
    ├── hooks/                # Client hooks (e.g. Realtime demo)
    ├── lib/                  # Cross-cutting utilities (supabase, ai, queue, log)
    ├── server/               # Domain logic not tied to HTTP shape
    ├── stores/               # Zustand (UI-only state)
    └── middleware.ts         # Session refresh + auth gating
```

## `src/app` — routes and responsibilities

### Route groups

| Group | Example paths | Purpose |
| --- | --- | --- |
| Marketing / public | `/`, `/signup`, `/accept-invite` | No app shell; optional auth redirects handled in middleware |
| Auth callback | `/auth/callback` | Exchanges OAuth / magic-link `code` for a session |
| Authenticated app | `/dashboard`, `/projects`, `/settings` | Wrapped by `(app)/layout.tsx` + `AppShell` |
| API | `/api/*` | Route Handlers: webhooks, transcript ingest, health |

### Notable Route Handlers (`src/app/api`)

| Path | Role |
| --- | --- |
| `GET /api/health` | Liveness for orchestrators |
| `POST /api/webhooks/slack` | Signature verification + optional service-role fan-out + enqueue |
| `POST /api/webhooks/gmail` | Pub/Sub stub; enqueue |
| `POST /api/projects/[id]/transcripts` | Ingest transcript, call AI service, create approvals + timeline event |
| `POST /api/queue/internal` | Protected internal hook (`INTERNAL_JOB_SECRET`) |

### Server Actions (`src/app/actions`)

| File | Use |
| --- | --- |
| `approvals.ts` | Approve/reject `approval_requests`; sync linked `ai_suggestions` / `communication_drafts`; write `audit_logs` + `operational_events` |
| `workspace-invites.ts` | Create invite (admin); accept invite via RPC |

Prefer **server actions** for mutations triggered directly from the UI; use **route handlers** for webhooks and third-party POSTs.

## `src/lib` — shared building blocks

| Module | Responsibility |
| --- | --- |
| `lib/supabase/client.ts` | Browser Supabase client (use in `"use client"` components only) |
| `lib/supabase/server.ts` | Server component / route handler client + `createServiceRoleClient` |
| `lib/supabase/middleware.ts` | Cookie adapter for refreshing sessions in Edge middleware |
| `lib/validations/api.ts` | Zod schemas reused by API routes and actions |
| `lib/logger.ts` | JSON-line logging to stdout |
| `lib/queue/*` | `getQueue()` singleton: BullMQ vs in-memory |
| `lib/ai/*` | Provider abstraction; `AIOperationalService` orchestrates proposals (no side effects) |
| `lib/env.ts` | Optional parsing helpers for env vars |

**Rule of thumb:** anything importable from both client and server must stay **free of secrets** and **free of service-role** usage.

## `src/server` — domain logic

| Path | Responsibility |
| --- | --- |
| `server/services/operational/event-engine.ts` | `appendOperationalEvent` — central timeline writes + optional queue side effects |
| `server/services/operational/project-state.ts` | Example aggregate read across milestones/risks/memory |
| `server/services/operational/reminder-engine.ts` | Stub for reminder scanning |
| `server/services/integrations/*` | Slack/Gmail/Sheets adapters (mostly stubs + comments) |
| `server/repositories/projects-repository.ts` | Query helpers for dashboards/lists |

When adding a new integration, start here with **pure functions** + explicit IO boundaries, then call them from `src/app/api`.

## Data model essentials (Supabase)

You do not need every table memorized, but you **do** need these relationships:

- `auth.users` → `public.profiles` (trigger on signup)
- `organizations` → `workspaces` → `projects`
- Membership: `workspace_members`, `project_members`
- Operational memory: `milestones`, `tasks`, `risks`, `blockers`, `project_memory`, `operational_events`
- Human gates: `approval_requests`, `ai_suggestions`, `communication_drafts`, `audit_logs`

**RLS is on.** If a query returns empty, assume membership or policy first — not “missing code.”

## Auth & session model

1. **Middleware** (`src/middleware.ts`) calls `updateSession` so refresh tokens rotate safely.
2. **Protected prefixes** (`/dashboard`, `/projects`, `/settings`) require a logged-in user.
3. **Server data fetching** uses `createClient()` from `lib/supabase/server.ts` so RLS runs as the signed-in user.
4. **Service role** is reserved for trusted server paths (e.g., Slack webhook after signature verification). Never import it into client bundles.

## Conventions for new work

1. **Validate at the boundary** with Zod (`src/lib/validations`).
2. **Log with context** via `logger.info|warn|error` (structured JSON).
3. **Write operational narrative** to `operational_events` when user-visible state changes (integrations, approvals, AI proposals ingested).
4. **Prefer explicit approval artifacts** over silent state mutation when AI or integrations suggest external impact.
5. **Keep migrations forward-only**; document manual data fixes in `docs/` or runbooks if needed.

## Commands

```bash
npm run dev      # Next dev server (Turbopack)
npm run build    # Production build + typecheck
npm run lint     # ESLint
npm run worker   # Requires REDIS_URL; BullMQ consumer
```

## Extension checklist (example: “new integration”)

1. Add/extend tables + RLS in `supabase/migrations/*.sql`.
2. Add Zod schemas for inbound payloads.
3. Implement adapter under `src/server/services/integrations/`.
4. Expose a Route Handler under `src/app/api/...` with verification + enqueue.
5. Document env vars in `.env.example` and `docs/SETUP.md`.
6. Add a settings page or section describing OAuth scopes and ops runbook.

## Where to ask “why is it like this?”

- Product guardrails (human-in-the-loop, no autonomous agents): `docs/ARCHITECTURE.md`
- Schema intent and RLS: read the migration SQL comments and policy names
- Slack/Gmail/Sheets caveats: integration service files + settings pages under `src/app/(app)/settings/`
