# SignalOps

SignalOps is a **human-in-the-loop** operational coordination and project intelligence platform. It is **not** a chatbot product: AI proposes summaries, drafts, risks, and timeline signals, while **people approve** outbound actions and structural changes.

This repository ships a **production-oriented** Next.js + Supabase reference implementation with modular services, typed validation, operational event fan-out, integration webhooks, and an AI abstraction layer that **never** self-executes customer-facing workflows.

## Tech stack

- **Frontend**: Next.js (App Router) + React + TypeScript + Tailwind + shadcn-style UI primitives
- **Backend**: Next.js Route Handlers + Server Actions
- **Database / Auth / Storage / Realtime**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **State**: Zustand (UI shell state; server remains source of truth)
- **Validation**: Zod
- **Jobs**: BullMQ when `REDIS_URL` is set; otherwise an in-memory queue for local development
- **AI**: OpenAI-ready provider (`OPENAI_API_KEY`) with graceful degradation

## Repository layout

```
src/
  app/                 # Routes (marketing, auth, app shell, API handlers)
  components/          # UI + feature components
  hooks/               # Client hooks (Supabase Realtime example)
  lib/                 # env, logger, AI providers, queue ports, Supabase helpers, validations
  server/              # Domain services (integrations, operational engine)
  stores/              # Zustand stores
supabase/migrations/   # SQL schema, RLS, triggers
scripts/worker.ts      # BullMQ worker entrypoint (requires Redis)
```

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and fill in Supabase keys.

3. **Apply database schema**

   Run `supabase/migrations/20240521000000_signalops_initial.sql` in the Supabase SQL editor (or via the Supabase CLI against your project).

4. **Bootstrap tenant data**

   After your first user signs up, insert an organization, workspace, project, and memberships. See `supabase/seed.sql` for commented templates.

5. **Run the app**

   ```bash
   npm run dev
   ```

6. **Optional: background worker**

   ```bash
   export REDIS_URL=redis://localhost:6379
   npm run worker
   ```

## Human approval model

- AI output for meeting transcripts creates `ai_suggestions` and `approval_requests` rows in a **pending** state.
- Communication drafts remain in `pending_approval` until a PM approves.
- Server action `src/app/actions/approvals.ts` records decisions and appends an `operational_events` audit entry.

## Google Sheets layer (optional)

`GoogleSheetsSyncService` documents an optional mirror. **Operational warning:** Sheets are acceptable for early operational memory and stakeholder visibility, but they exhibit weaker concurrency semantics, auditing, and programmatic guarantees than PostgreSQL. Treat **Postgres as canonical** (`milestones`, `risks`, `project_memory`, `operational_events`) and migrate away from bi-directional Sheets if write volume or multi-editor contention grows.

## Slack & Gmail integrations

- **Slack**: `POST /api/webhooks/slack` verifies `SLACK_SIGNING_SECRET`, optionally fans out through Supabase with `SUPABASE_SERVICE_ROLE_KEY`, and enqueues `slack.event` jobs. See `src/server/services/integrations/slack-processing.ts` and `/settings/slack`.
- **Gmail**: Pub/Sub push lands on `POST /api/webhooks/gmail` (OIDC verification should be added for production). See `src/server/services/integrations/gmail-sync.ts` and `/settings/gmail`.

## Operational event engine

`appendOperationalEvent` writes to `operational_events` and opportunistically enqueues downstream sync jobs (for example Sheets mirrors). This keeps a unified timeline across Slack, email, meetings, AI insights, and approvals.

## Realtime

`src/hooks/use-notifications-channel.ts` demonstrates subscribing to `notifications` inserts. Enable the `notifications` table (and other operational tables as needed) in the Supabase Realtime publication from the dashboard when you are ready for live updates.

## Docker

```bash
docker compose up --build
```

The compose file runs the web app and Redis. Provide `.env.local` with production-like values before deploying.

## Deployment notes

- Rotate `INTERNAL_JOB_SECRET` and restrict `POST /api/queue/internal` to your private network or an authenticated scheduler.
- Store Slack/Google tokens using Supabase Vault or a cloud KMS — the schema columns are placeholders.
- Add observability (structured logs are JSON lines via `src/lib/logger.ts`) and error tracking (Sentry, etc.) in your environment.
- Scale workers independently from the web tier when using BullMQ.

## Security

- Row Level Security enforces multi-tenant isolation across organizations, workspaces, and projects.
- Service role keys must **never** ship to the browser; they are only for trusted server routes such as verified webhooks.

## License

Private / unlicensed by default — update this section for your distribution model.


## Workspace invites

After applying migrations, run `supabase/migrations/20240521120000_workspace_invite_accept.sql` (or keep it in order with the Supabase CLI) to add:

- A workspace-member insert policy for admins
- The `accept_workspace_invite(token)` RPC used by `/accept-invite`

Workspace owners/admins can create invites from **Settings → Team & invites**. Invited users should create an account with the invited email, sign in, then redeem the token on `/accept-invite`.
