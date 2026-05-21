# SignalOps architecture notes

## Design principles

1. **Human-in-the-loop by default.** AI proposes; workflows that touch customers or production systems require explicit approval artifacts (`approval_requests`, draft states, audit logs).
2. **Postgres is the system of record.** External systems (Slack, Gmail, Sheets) are adapters that emit `operational_events` and structured rows — not the other way around.
3. **Thin edge, thick domain.** Route handlers validate and delegate; domain logic lives under `src/server` and `src/lib`.
4. **Observable and retry-friendly.** Webhooks acknowledge quickly, enqueue durable jobs when Redis is configured, and log structured JSON for ingestion by your log stack.

## Layering

| Layer | Responsibility |
| --- | --- |
| `src/app/api/*` | Transport concerns, auth, signature verification, request parsing |
| `src/lib/validations` | Zod schemas shared by API routes and actions |
| `src/server/services` | Integration adapters, operational engines |
| `src/lib/ai` | Provider abstraction — swap OpenAI for another vendor behind the same service API |
| `src/lib/queue` | Queue port + BullMQ / in-memory adapters |

## Multi-tenant model

- `organizations` represent billing / legal tenants.
- `workspaces` segment delivery teams inside an organization.
- `projects` map to operational initiatives.
- `project_members` captures PM / contributor / viewer roles for finer control (RLS currently leans on workspace membership; tighten where needed).

## What is intentionally not built

- Autonomous agent swarms, tool-chaining loops without supervision, or un-audited sends to third parties.
- A full OAuth UI for Slack/Google inside this repository — the settings pages document the contract and checklist instead of storing long-lived tokens in git.

## Evolution paths

1. **Sheets → warehouse:** replicate operational snapshots to a warehouse (BigQuery, Snowflake) while keeping OLTP in Postgres.
2. **Workers:** move webhook parsing to dedicated workers with idempotency keys (`slack.event` already carries `event_id` when present).
3. **Policy tightening:** split `projects` RLS so only `project_members` (plus admins) can mutate sensitive entities.
