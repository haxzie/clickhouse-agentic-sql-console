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

### Environment variables

The API reads these (all optional, defaults shown):

| Variable | Default | Purpose |
| --- | --- | --- |
| `CLICKHOUSE_URL` | `http://localhost:8123` | ClickHouse HTTP endpoint |
| `PORT` | `8080` | API port |
| `WEB_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `DATABASE_PATH` | `apps/api/data/app.db` | SQLite file holding saved connections |
| `ENCRYPTION_KEY` | insecure dev fallback | Key used to encrypt connection passwords at rest |

`CLICKHOUSE_URL` seeds the first connection on an empty database; after that,
connections are managed in the UI and stored in SQLite (Drizzle ORM). Connection
passwords are encrypted with AES-256-GCM and are never returned to the browser.
Set `ENCRYPTION_KEY` to anything other than the development fallback before
storing a real credential; changing it later makes existing secrets
undecryptable.

Schema changes: edit `apps/api/src/db/schema.ts`, then run
`pnpm --filter @clickhouse-ai/api db:generate`. Migrations are applied
automatically on API start.

The AI SDK providers are installed but not wired to a route yet. When they are,
an LLM key will be needed — `OPENAI_API_KEY` (from https://platform.openai.com/api-keys)
or `ANTHROPIC_API_KEY` (from https://console.anthropic.com/settings/keys) — set in
`apps/api/.env` or exported in the shell.

## Start the application

`pnpm dev` starts both apps (API on :8080, web on :5173, proxying `/api/*` to the API).

Individually:

- `pnpm --filter @clickhouse-ai/api dev`
- `pnpm --filter @clickhouse-ai/web dev`

## Test the application

`pnpm test`

Other workspace scripts: `pnpm typecheck`, `pnpm build`.
