# OfficePal orchestrator (Track 2)

The "brain" — a small persistent Node/TypeScript service using the
[Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
to turn a field report into a priced invoice draft or a quote, gated by each
tenant's trust settings. Deployed separately from the Next.js app (see
`../BUILD-CONTRACT.md`). Next.js calls this service over HTTP — it does not
implement agent logic itself.

## Architecture

- `src/agent/client.ts` — runs a `query()` session from the Agent SDK with
  four in-process MCP tools (`src/tools/`) and no filesystem/bash access.
- `src/tools/` — `extract_field_report`, `create_invoice_draft`,
  `create_quote_draft`, `check_trust_level`. Zod schemas
  (`src/tools/schemas.ts`) are the strict-JSON-schema boundary — none of them
  has a price/amount field, so the model has no field to put a guessed price
  in. Prices are always a server-side lookup (`src/lib/pricing.ts`) against
  `tenants.settings.price_list`.
- Every writing tool (`create_invoice_draft`, `create_quote_draft`) calls
  `check_trust_level` (`src/lib/trust.ts`) before writing, in code — not just
  by prompt instruction, so it doesn't depend on the model remembering to.
- `src/hooks/logToolOutcome.ts` — a genuine Agent SDK `PostToolUse` hook that
  writes the outcome of every writing-tool call to `approvals`, insert-only.
- `src/routes/processReport.ts` — `POST /process-report`, runs the agent for
  one field report.
- `src/routes/approve.ts` — `POST /approve`, the human half of the trust
  gate (used by the admin dashboard, Track 4).

## Known contract gaps (flagged, not silently worked around)

BUILD-CONTRACT.md and `supabase/schema.sql` disagree in two places. Rather
than modify Track 1's schema (out of scope for this track), the orchestrator
works within the actual DB constraints and documents the gap:

1. **`approvals.action` only allows `'approved' | 'rejected'`** (DB check
   constraint), but BUILD-CONTRACT.md's wording ("logga *every* tool call
   outcome") could be read as wanting an "awaiting" entry too. There is no
   valid `action` value for that. An "awaiting" outcome is represented by the
   target row's own status (`invoice_drafts.status = 'awaiting_approval'`)
   and a structured log line, not an `approvals` row. See
   `src/lib/approvals.ts`.
2. **`quotes` has no `approved`/`rejected` status value** (its statuses are
   `draft | sent | followed_up | accepted | expired`). A quote's trust
   decision therefore lives only in `approvals`, never as a `quotes.status`
   transition. See `src/routes/approve.ts`.

If Track 1 wants to close these gaps (e.g. add an `awaiting` action value,
or a `quotes` status for rejection), this file's `src/types.ts` and the two
files above are where to update the orchestrator side.

## `lib/types.ts` reconciliation note

This service can't import `../lib/types.ts` (Track 1's types) directly — it's
a separate deployable with its own `package.json` and no shared build step
with the Next.js app. `src/types.ts` is a hand-copied mirror of
`lib/types.ts` as of the commit that added it to this branch. If Track 1
changes `lib/types.ts` or `supabase/schema.sql`, update `src/types.ts` to
match by hand.

(Also: the row types in `src/types.ts` are `type` aliases, not `interface`s,
on purpose — see the comment at the top of that file. An `interface` there
silently breaks `supabase-js`'s generic type inference and every
`supabase.from(...)` call resolves to `never`.)

## Local development

```bash
cd orchestrator
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
npm run dev             # tsx watch, listens on PORT (default 8787)
```

`npm run typecheck` and `npm run build` (→ `dist/`) are also available.

## HTTP API

Both routes require the caller to be trusted server-side code (Track 3/4's
Next.js API routes), never a browser directly. If
`ORCHESTRATOR_SHARED_SECRET` is set, every request must send it as the
`x-orchestrator-token` header.

### `POST /process-report`

```json
{
  "tenant_id": "uuid",
  "staff_id": "uuid",
  "raw_text": "fritext fältrapport...",
  "field_report_id": "uuid (optional — omit to have this route create the row)"
}
```

Runs the orchestration agent once: extracts structured data, then creates an
invoice draft or a quote draft (or both), gated by `trust_settings`.

### `POST /approve`

```json
{
  "tenant_id": "uuid",
  "target_type": "invoice_draft | quote",
  "target_id": "uuid",
  "action": "approved | rejected",
  "decided_by": "uuid (admin's auth.users id, optional)"
}
```

## Deploying to Fly.io

Requires the [`flyctl`](https://fly.io/docs/flyctl/install/) CLI and a Fly
account. Run these from `orchestrator/` (this directory) — `fly.toml` and
the `Dockerfile` are already here.

1. **Log in** (once per machine):
   ```bash
   fly auth login
   ```

2. **Launch the app** (first time only — creates the Fly app, does *not*
   deploy secrets or overwrite the provided `fly.toml`/`Dockerfile`):
   ```bash
   fly launch --no-deploy --copy-config
   ```
   When prompted:
   - Use the existing `fly.toml` (don't let it regenerate one).
   - Pick an app name (or accept the generated one) — update `app =` in
     `fly.toml` to match if you change it.
   - Choose a region close to Sweden (`fly.toml` defaults to `arn`,
     Stockholm).
   - Say **no** to adding a Postgres/Redis database — Supabase is the DB.

3. **Set secrets** (never commit these — they go directly to Fly, not into
   `fly.toml`):
   ```bash
   fly secrets set \
     SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co" \
     SUPABASE_SERVICE_ROLE_KEY="..." \
     ANTHROPIC_API_KEY="sk-ant-..." \
     ORCHESTRATOR_SHARED_SECRET="$(openssl rand -hex 32)"
   ```
   Save the generated `ORCHESTRATOR_SHARED_SECRET` value — Track 3/4's
   Next.js API routes need the same value to call this service.

4. **Deploy**:
   ```bash
   fly deploy
   ```

5. **Verify**:
   ```bash
   curl https://<your-app-name>.fly.dev/health
   # {"ok":true}
   ```

6. **Redeploying** after changes: just `fly deploy` again from this
   directory. `fly secrets set` is only needed when a secret value changes.

`fly.toml` sets `min_machines_running = 0` (scales to zero when idle, fine
for a pilot with one tenant) and a `/health` check.
