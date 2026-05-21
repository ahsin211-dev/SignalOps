# SignalOps — setup guide

This guide walks you from an empty machine to a running SignalOps instance. The [root README](../README.md) contains a shorter quick start; this file adds detail, ordering, and troubleshooting.

## Prerequisites

- **Node.js 20+** (matches Docker image)
- **npm** (ships with Node)
- A **Supabase** project (free tier is fine for development)
- Optional: **Docker** + Docker Compose for containerized Redis and the web app
- Optional: **Redis** if you run the BullMQ worker outside Compose

## 1. Clone and install

```bash
git clone <your-fork-or-repo-url> signalops
cd signalops
npm install
```

## 2. Create a Supabase project

1. In [Supabase Dashboard](https://supabase.com/dashboard), create a project and wait for the database to finish provisioning.
2. Under **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the browser)

## 3. Configure authentication URLs

Under **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` for local development (or your deployed URL).
- **Redirect URLs**: include `http://localhost:3000/auth/callback` (and production callback URLs when you deploy).

This allows password login, magic links, and OAuth redirects to complete.

## 4. Environment variables

Copy the template and edit values:

```bash
cp .env.example .env.local
```

See `.env.example` for every variable. Minimum for core UI + database:

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | App, Auth | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App, Auth | Public; safe in browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Slack webhook DB fan-out, admin scripts | **Secret**; server only |

Optional:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Transcript AI analysis; omitted = graceful placeholder copy |
| `REDIS_URL` | BullMQ queue; omitted = in-memory queue (non-durable) |
| `SLACK_SIGNING_SECRET` | Verifies Slack webhooks |
| `INTERNAL_JOB_SECRET` | Protects `POST /api/queue/internal` |

## 5. Apply database migrations (order matters)

Run these SQL files **in order** against your Supabase SQL editor (or use `supabase db push` / linked CLI):

1. `supabase/migrations/20240521000000_signalops_initial.sql` — enums, tables, RLS, triggers, `profiles` sync from `auth.users`
2. `supabase/migrations/20240521120000_workspace_invite_accept.sql` — workspace invite RPC + admin insert policy on `workspace_members`

If a statement fails because an object already exists, adjust for your environment or split idempotent reruns carefully.

## 6. Bootstrap tenant data

RLS expects you to belong to a **workspace** (and usually an **organization**) before `projects` rows are visible.

After you **sign up** once (so `auth.users` and `public.profiles` exist):

1. Open `supabase/seed.sql` in this repo.
2. Replace `:user_id` with your user id from **Authentication → Users** in the Supabase dashboard.
3. Uncomment and run the blocks to create organization → workspace → project → memberships.

Alternatively, insert equivalent rows manually using the SQL editor.

## 7. Run the Next.js app

```bash
npm run dev
```

Open `http://localhost:3000`. Use **Sign up** / **Sign in** under `/signup` and `/login`.

Protected areas (`/dashboard`, `/projects`, `/settings`) redirect to login when there is no session.

## 8. Optional: Redis + worker

```bash
# terminal 1 — Redis (or use docker compose)
redis-server

# terminal 2
export REDIS_URL=redis://127.0.0.1:6379
npm run worker
```

The worker consumes the `signalops` BullMQ queue. Job handlers are stubs until you wire domain logic.

## 9. Optional: Docker Compose

```bash
docker compose up --build
```

Compose expects `.env.local` (or adjust `docker-compose.yml` to use `.env`). It starts the web app and Redis.

## Troubleshooting

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| Redirect to `/login?error=config` | Missing Supabase env in `.env.local` | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| “No projects” everywhere | RLS + no membership rows | Run `seed.sql` with your user id; confirm `workspace_members` |
| Slack webhook 501 | `SLACK_SIGNING_SECRET` unset | Add secret or skip Slack until configured |
| Invite accept fails | Migration 2 not applied or email mismatch | Apply `20240521120000_*`; invitee must use **same email** as the invite |
| AI summary placeholder | No OpenAI key | Set `OPENAI_API_KEY` or accept degraded mode |

## Next steps

- Read [Developers](./DEVELOPERS.md) for how the codebase is organized.
- Read [Architecture](./ARCHITECTURE.md) for design constraints (human-in-the-loop, no autonomous agents).
