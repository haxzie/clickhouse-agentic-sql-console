## Work assignment

Timebox: Aim for 4–8 hours. If you run out of time, include a "Next steps" section.

We are looking for a Senior Software Engineer to drive the development of AI/ML-powered features in ClickHouse Cloud. Given the current project, let's create an agentic experience for a SQL query editor. When opening the `/` the React application should render and display a SQL editor where we can write our natural language and SQL queries. For inspiration, you can sign up for a free trial in ClickHouse Cloud and experiment with the fully-featured SQL Console. This project is used as a conversation piece for the next stage of the interview process.

Implement the following features in TypeScript

- Using a LLM of your choice (local / OpenAI / Anthropic) input natural language to generate SQL queries
- Run single or multiple queries and display the query results in the UI
- Finish with a summary of the query and results

We encourage you to make this project _your own_ by being creative. Here are some ideas

- Streaming results
- Query diagnostics
- Next step recommendations after a query has run

Note:

We will not review the quality of the output of the LLM - just the integration work. If you use a 3rd party with API key, please provide instructions for the reviewer to obtain their own key - commercial models are fine. We have our [UI component library](https://click-ui.vercel.app) if you want some help with the components design that can give you some leverage and accelerate speed of development, but you are free to use whatever you would prefer. If you have any questions feel free to reach out to the hiring manager or recruiter. Feel free to use an agentic coding tool, but please let us know what you used and do not submit code you do not understand or can defend.

## Repository layout

This is a pnpm workspace monorepo:

```
apps/api   Hono API server (ClickHouse client + AI SDK)
apps/web   React + Vite + TypeScript SQL console
```

## Setup

- Requires docker and docker compose
- Requires Node 20+
- Requires pnpm 10+ (`corepack enable pnpm`)

```
docker compose up -d
nvm use
pnpm install
```

### Seed data

`docker compose up` loads the **Northwind** sales dataset into a `northwind`
database on first start: 8 related tables (orders, order_details, products,
categories, customers, suppliers, employees, shippers) covering 1996-1998, with
830 orders and 2,155 order lines. It is small, famously relational and gives the
assistant real joins to find.

The CSVs live in `docker/seed` (~200 KB, committed so setup works offline);
`scripts/fetch-seed.sh` re-downloads them from the upstream mirror. The schema
in `docker/initdb` carries column comments — the assistant's schema search reads
them, so `discount` explains that revenue is
`unit_price * quantity * (1 - discount)`.

Seeding runs only on an empty data volume. To reload after changing the schema:

```
docker compose down -v && docker compose up -d
```

### Environment variables

The API reads these (all optional, defaults shown):

| Variable | Default | Purpose |
| --- | --- | --- |
| `CLICKHOUSE_URL` | `http://localhost:8123` | ClickHouse HTTP endpoint |
| `PORT` | `8080` | API port |
| `WEB_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `DATABASE_PATH` | `apps/api/data/app.db` | SQLite file holding saved connections |
| `ENCRYPTION_KEY` | insecure dev fallback | Key used to encrypt connection passwords at rest |
| `ANTHROPIC_API_KEY` | _unset_ | **Required for the assistant**; create one at https://console.anthropic.com/settings/keys |
| `CHAT_MODEL` | `claude-opus-5-5` | Model used by the assistant |
| `SEARCH_MODEL` | `claude-haiku-4-5-20251001` | Model used by the schema-search sub-agent |

`CLICKHOUSE_URL` seeds the first connection on an empty database; after that,
connections are managed in the UI and stored in SQLite (Drizzle ORM). Connection
passwords are encrypted with AES-256-GCM and are never returned to the browser.
Set `ENCRYPTION_KEY` to anything other than the development fallback before
storing a real credential; changing it later makes existing secrets
undecryptable.

Schema changes: edit `apps/api/src/db/schema.ts`, then run
`pnpm --filter @clickhouse-ai/api db:generate`. Migrations are applied
automatically on API start.

### Anthropic API key

The assistant streams from `POST /chat` through the AI SDK, using Anthropic's
Opus model (`claude-opus-5-5`) for the chat and Haiku for the schema-search
sub-agent. To enable it:

```bash
cp apps/api/.env.example apps/api/.env
# then edit apps/api/.env and set ANTHROPIC_API_KEY=sk-ant-...
```

Create a key at <https://console.anthropic.com/settings/keys>. The API loads
`apps/api/.env` on start, whether you launch it from the repo root or from
`apps/api`; a real environment variable of the same name takes precedence, so
`ANTHROPIC_API_KEY=... pnpm dev` works too. `.env` is gitignored.

Without a key the console still works — browse the schema, run queries, read
results — and only the assistant returns a 503 saying the key is missing. The
API also logs a warning at startup.

`@ai-sdk/openai` is installed if you would rather swap the provider in
`apps/api/src/routes/chat.ts` and `apps/api/src/lib/model.ts`.

The assistant has five tools. `search` runs on the API as a sub-agent with a
single tool of its own: `bash`. The connection's schema is written to a
workspace of line-oriented files (`columns.tsv`, `tables.tsv`,
`ddl/<db>/<table>.sql`, cached for five minutes), and the sub-agent greps and
reads its way around before reporting the tables and columns that serve the use
case, with an instruction for the main agent. The shell is restricted to an
allowlist of read-only commands joined by `|`; redirection, command
substitution, sequencing and unknown binaries are rejected, and it runs with a
timeout, an output cap and no inherited environment.

The sub-agent also has `run_sql` for sampling the data itself — distinct values,
date ranges, how often a column is empty — so it can confirm what a column holds
rather than trusting its name. Statements must be a single read; results are
capped by wrapping the query in an outer `LIMIT 50` (ClickHouse's
`max_result_rows` only breaks on block boundaries and does not cap reliably),
with a five-second execution limit and `readonly = 2` so the server refuses
writes even if the statement check is fooled. The other four —
`get_editor_state`, `str_replace`, `replace_selection`, `insert_at_cursor` and
`set_query` — are declared on the server but executed in the browser, which
owns the editor buffer. Each edit carries the `version` token from the last
`get_editor_state`; if the user typed in the meantime the edit is rejected and
the model is handed the fresh buffer to retry against, so typing is never
clobbered.

Every applied edit is then validated: the resulting statements are checked with
`EXPLAIN SYNTAX` on the connected server (`POST /validate`), which catches
syntax errors, unknown tables and unknown columns without running anything. The
tool result carries a `validation` field, so a broken buffer is reported in the
step that broke it rather than when the user next hits Run. A sixth tool,
`get_last_error`, returns the last failed run from the console with the
statement behind it, for when the user says "fix the error" without quoting
it.

## Start the application

`pnpm dev` starts both apps (API on :8080, web on :5173, proxying `/api/*` to the API).

Individually:

- `pnpm --filter @clickhouse-ai/api dev`
- `pnpm --filter @clickhouse-ai/web dev`

## Test the application

`pnpm test`

Other workspace scripts: `pnpm typecheck`, `pnpm build`.
