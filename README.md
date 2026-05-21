# SignalOps

SignalOps is a **human-in-the-loop** operational coordination and project intelligence platform. It is **not** a generic chatbot: AI proposes summaries, drafts, risks, and timeline signals, while **people approve** outbound actions and material state changes.

This repository is a **production-oriented** reference app: **Next.js (App Router)** + **Supabase** (Postgres, Auth, Storage, Realtime) + typed APIs, modular services, webhooks, and an **AI abstraction** that never self-executes customer-facing workflows.

---

## Documentation

| Doc | What it is for |
| --- | --- |
| **[docs/SETUP.md](./docs/SETUP.md)** | Full setup: Supabase project, env vars, migrations in order, bootstrap data, Docker, worker, troubleshooting |
| **[docs/DEVELOPERS.md](./docs/DEVELOPERS.md)** | **Start here as a dev**: repository structure, modules, auth/RLS, conventions, extension checklist |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Design principles, layering, multi-tenant model, intentional non-goals |
| **[docs/README.md](./docs/README.md)** | Index of all documentation |

---

## Setup (quick start)

> For screenshots-level detail, auth URL configuration, and common errors, use **[docs/SETUP.md](./docs/SETUP.md)**.

### Prerequisites

- **Node.js 20+**
- A **Supabase** project

### Steps

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill at minimum `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (for webhooks / admin paths) `SUPABASE_SERVICE_ROLE_KEY`. See `.env.example` for the full list.

3. **Database — run SQL migrations in order**

   In the Supabase SQL editor (or via Supabase CLI linked to the project), execute:

   1. `supabase/migrations/20240521000000_signalops_initial.sql`
   2. `supabase/migrations/20240521120000_workspace_invite_accept.sql` (workspace invites RPC + policies)

4. **Bootstrap data**

   Sign up once via `/signup` so `auth.users` + `public.profiles` exist. Then run the commented SQL in **`supabase/seed.sql`** (replace `:user_id` with your user id from the Supabase dashboard) to create an organization, workspace, project, and memberships so RLS allows reads.

5. **Run**

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`. Protected routes: `/dashboard`, `/projects`, `/settings`.

6. **Optional — background worker (BullMQ)**

   ```bash
   export REDIS_URL=redis://localhost:6379
   npm run worker
   ```

7. **Optional — Docker**

   ```bash
   docker compose up --build
   ```

---

## Tech stack

- **Frontend**: Next.js App Router, React, TypeScript, Tailwind, shadcn-style UI primitives (`src/components/ui`)
- **Backend**: Route Handlers (`src/app/api`) + Server Actions (`src/app/actions`)
- **Data**: Supabase Postgres with **RLS**; Auth; Storage-ready schema (transcripts can use `storage_path`)
- **Validation**: Zod (`src/lib/validations`)
- **Jobs**: BullMQ when `REDIS_URL` is set; otherwise in-memory queue (`src/lib/queue`)
- **AI**: OpenAI-compatible provider behind `src/lib/ai` (graceful degradation without `OPENAI_API_KEY`)

---

## Repository layout (abbrev.)

```
docs/                    # SETUP, DEVELOPERS, ARCHITECTURE
supabase/migrations/     # SQL schema + RLS (ordered)
src/app/                 # Pages, layouts, API routes, actions
src/components/          # UI + feature components
src/lib/                 # supabase clients, ai, queue, logger, validations
src/server/              # domain services + repositories
scripts/worker.ts        # BullMQ worker entrypoint
```

A fuller tree and module responsibilities live in **[docs/DEVELOPERS.md](./docs/DEVELOPERS.md)**.

---

## Human approval model

- Transcript ingestion creates **`ai_suggestions`** + **`approval_requests`** in a **pending** state (`src/app/api/projects/[id]/transcripts/route.ts`).
- Communication drafts use **`pending_approval`** until approved.
- **`src/app/actions/approvals.ts`** updates the approval, syncs linked entities, writes **`audit_logs`**, and appends **`operational_events`**.

---

## Integrations (stubs + checklists)

- **Slack**: `POST /api/webhooks/slack` — `SLACK_SIGNING_SECRET`, optional `SUPABASE_SERVICE_ROLE_KEY` for DB fan-out. See `src/server/services/integrations/slack-processing.ts` and `/settings/slack`.
- **Gmail**: `POST /api/webhooks/gmail` — Pub/Sub placeholder; see `src/server/services/integrations/gmail-sync.ts` and `/settings/gmail`.
- **Google Sheets**: optional mirror; Postgres remains canonical — see `GoogleSheetsSyncService` and **docs/ARCHITECTURE.md**.

---

## Operational timeline

`appendOperationalEvent` (`src/server/services/operational/event-engine.ts`) writes **`operational_events`** and can enqueue downstream jobs (e.g. Sheets sync). This is the unified narrative across Slack, email, meetings, AI, and approvals.

---

## Realtime

`src/hooks/use-notifications-channel.ts` shows how to subscribe to `notifications`. Enable tables in the Supabase **Realtime** publication from the dashboard when you are ready.

---

## Deployment & security notes

- Rotate **`INTERNAL_JOB_SECRET`** and restrict **`POST /api/queue/internal`** to private networks or authenticated schedulers.
- Never expose **`SUPABASE_SERVICE_ROLE_KEY`** to the browser; use only in trusted server code (e.g. verified webhooks).
- Store third-party tokens in **Vault/KMS** in production — DB columns are placeholders.
- Add your preferred **observability** stack; logs are JSON lines via `src/lib/logger.ts`.

---

## License

Private / unlicensed by default — update for your distribution model.
