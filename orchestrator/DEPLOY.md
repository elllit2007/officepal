# Deploying the orchestrator to Fly.io

Run every command in this file from `orchestrator/` (this directory).
`fly.toml` and `Dockerfile` are already here — you don't need `fly launch`
to generate them from scratch.

## Prerequisites

- [`flyctl`](https://fly.io/docs/flyctl/install/) installed.
- A Fly.io account.
- Your Supabase project URL and **service role** key (Project Settings → API
  — not the `anon` key).
- An Anthropic API key with access to the model in `src/agent/client.ts`
  (`claude-sonnet-5`).

## 1. Log in

```bash
fly auth login
```

Once per machine.

## 2. Launch the app

```bash
fly launch --no-deploy --copy-config --name officepal-orchestrator --region arn
```

- `--copy-config` uses the `fly.toml` already in this directory instead of
  generating a new one.
- `--no-deploy` creates the Fly app and registers the config, but does
  *not* deploy yet — you want secrets set first (step 3), otherwise the
  first deploy will crash-loop on the "Missing required environment
  variable" check in `src/config.ts`.
- `--name` / `--region` pre-answer the two prompts `fly launch` would
  otherwise ask interactively. `officepal-orchestrator` must be globally
  unique across all of Fly — if it's taken, pick another name, then edit
  `app =` in `fly.toml` to match before deploying. `arn` is Stockholm,
  already set in `fly.toml` as the default region for this pilot.

If `flyctl` prompts anyway (version-dependent), answer:
- *"Would you like to copy its configuration to the new app?"* → **yes**.
- *Postgres / Redis database?* → **no** — Supabase is the database.
- *Deploy now?* → **no** (or just let `--no-deploy` skip the question).

## 3. Set secrets

Never put real values in `fly.toml` — this sends them directly to Fly's
secret store instead:

```bash
fly secrets set \
  SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  ANTHROPIC_API_KEY="sk-ant-..." \
  ORCHESTRATOR_SHARED_SECRET="$(openssl rand -hex 32)"
```

Setting secrets triggers a new deploy automatically once the app exists.
That's fine even before step 4 — it's the same effect as `fly deploy`.

Save the generated `ORCHESTRATOR_SHARED_SECRET` value somewhere durable
(e.g. your password manager) — Track 3/4's Next.js API routes need the
*same* value (as `ORCHESTRATOR_SHARED_SECRET` in their own environment) to
call this service, since it's sent as the `x-orchestrator-token` header on
every request. `PORT` does not need to be set as a secret — it's already in
`fly.toml`'s `[env]` block.

## 4. Deploy

```bash
fly deploy
```

Builds `Dockerfile` remotely on Fly's builders and rolls it out. Re-run
this any time you change code — `fly secrets set` is only needed again when
a secret's *value* changes.

## 5. Verify

```bash
fly status
curl https://<your-app-name>.fly.dev/health
```

Expected response:

```json
{"ok":true}
```

If it hangs or 502s, check logs:

```bash
fly logs
```

Common first-deploy issues: a missing/misspelled secret (`fly secrets list`
to check what's set — values aren't shown, only names), or the app name in
`fly.toml`'s `app =` line not matching what `fly launch` actually created
(`fly apps list` to check).

## Redeploying later

```bash
fly deploy
```

That's it — no need to repeat `fly launch` or `fly secrets set` unless a
secret value changed.
