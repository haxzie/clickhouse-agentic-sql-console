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

## Quick start

Requires docker and docker compose, Node 20+, and pnpm 10+
(`corepack enable pnpm`). You also need an Anthropic API key, from
<https://console.anthropic.com/settings/keys>.

```bash
# 1. ClickHouse, with the Northwind dataset loaded on first start
docker compose up -d

# 2. Dependencies
nvm use
pnpm install

# 3. Build and run the console, with your key
ANTHROPIC_API_KEY=sk-ant-... pnpm start
```

Then open <http://localhost:8080>. The console serves the app and the API from
that one port.

Three things to know if a step does not go to plan:

- **ClickHouse takes a few seconds to accept connections** on the first run,
  while it loads the seed data. The explorer shows `northwind` with 8 tables
  once it is ready.
- **`docker compose up` publishes ports 8123, 9000, 9363 and 1443.** Only 8123
  is used by the app; if one of the others is taken on your machine, the
  container will not start. Removing the unused ports from
  `docker-compose.yml` is safe.
- **The API refuses to start without `ANTHROPIC_API_KEY`**, naming the
  variable, rather than failing on the first chat message. Putting the key in
  `apps/api/.env` saves repeating it; see
  [Anthropic API key](#anthropic-api-key).

For the development workflow — two processes, hot reload — see
[Start the application](#start-the-application).

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

The API validates its environment at startup (`apps/api/src/env.ts`, zod). A
missing or malformed variable stops the process with a message naming it,
rather than failing later as `NaN` or an empty key.

| Variable            | Default                     | Purpose                                                                                   |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | **required**                | The assistant's key; create one at https://console.anthropic.com/settings/keys            |
| `CLICKHOUSE_URL`    | `http://localhost:8123`     | ClickHouse HTTP endpoint                                                                  |
| `PORT`              | `8080`                      | API port                                                                                  |
| `WEB_ORIGIN`        | `http://localhost:5173`     | Allowed CORS origin                                                                       |
| `DATABASE_PATH`     | `apps/api/data/app.db`      | SQLite file holding saved connections                                                     |
| `ENCRYPTION_KEY`    | insecure dev fallback       | Key used to encrypt connection passwords at rest; **required** when `NODE_ENV=production` |
| `CHAT_MODEL`        | `claude-opus-5-5`           | Model used by the assistant                                                               |
| `SEARCH_MODEL`      | `claude-haiku-4-5-20251001` | Model used by the schema-search sub-agent and `POST /describe`                            |
| `NODE_ENV`          | `development`               | `production` tightens the two requirements above                                          |

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
sub-agent.

Create a key at <https://console.anthropic.com/settings/keys>, then pass it
inline when starting the app:

```bash
ANTHROPIC_API_KEY=sk-ant-... pnpm start
```

That is the whole setup — no file to create. The same works for `pnpm dev`.

To avoid repeating it, put the key in a file instead:

```bash
cp apps/api/.env.example apps/api/.env
# then edit apps/api/.env and set ANTHROPIC_API_KEY=sk-ant-...
```

The API loads `apps/api/.env` on start, whether you launch it from the repo
root or from `apps/api`. A variable set in the environment wins over the file,
so the inline form above overrides a key already saved there. `.env` is
gitignored.

The key is required: the API validates its environment at startup and refuses
to start without one, naming the variable, rather than letting the first chat
message fail.

`@ai-sdk/openai` is installed if you would rather swap the provider in
`apps/api/src/routes/chat.ts` and `apps/api/src/lib/model.ts`.

## The assistant

### Tools

| Tool                | Runs on | What it does                                                                            |
| ------------------- | ------- | --------------------------------------------------------------------------------------- |
| `search`            | API     | Finds the tables and columns for a use case. A sub-agent with its own tools; see below. |
| `get_editor_state`  | Browser | The buffer with line numbers, the cursor, the selection, and a `version` token.         |
| `get_last_error`    | Browser | The last failed run from the console, with the statement behind it.                     |
| `run_query`         | Browser | Runs what is in the editor and returns columns, row counts, timings and a sample.       |
| `str_replace`       | Browser | Replaces an exact, unique snippet, leaving surrounding formatting alone.                |
| `replace_selection` | Browser | Replaces the highlighted text.                                                          |
| `insert_at_cursor`  | Browser | Inserts at the cursor.                                                                  |
| `set_query`         | Browser | Rewrites the whole buffer.                                                              |

Only `search` has a server-side `execute`; it needs the ClickHouse connection.
The rest are declared on the server without one, so the AI SDK forwards the
call to the browser, which owns the editor buffer and streams the result back
(`apps/web/src/lib/editorTools.ts`). Every tool also takes `action_info`: a
short present-tense note the model writes for itself, which is what the chat
shows while the call runs, instead of the UI guessing from the tool name.

### Schema search

`search` is a sub-agent (Haiku, `apps/api/src/tools/searchSchema.ts`) with two
tools of its own:

- **`bash`** over the connection's schema, written as line-oriented files:
  `columns.tsv`, `tables.tsv`, `ddl/<db>/<table>.sql` and a `README.md`, cached
  for five minutes per connection. It greps and reads its way around rather
  than being handed a schema dump, which is what makes wide databases
  tractable — a use case about revenue can be matched against `amount`,
  `price`, `total` or `gross` without any of them fitting in a prompt.
- **`run_sql`** for sampling the data itself — distinct values, date ranges,
  how often a column is empty — so it can confirm what a column holds rather
  than trusting its name. One read-only statement per call, capped by wrapping
  it in an outer `LIMIT 50` (ClickHouse's `max_result_rows` only breaks on
  block boundaries and does not cap reliably), with a five-second execution
  limit and `readonly = 2` so the server refuses writes even if the statement
  check is fooled.

The shell is [just-bash](https://github.com/vercel-labs/just-bash): a simulated
bash over an in-memory filesystem holding those files and nothing else. There
is no host process, no network and no path outside the map, so commands need no
allowlist. Each one it runs is streamed back to the browser as a data part on
the chat stream, so the transcript shows the greps and samples as they happen
and folds them into an accordion once the call finishes.

It returns the matching tables and columns plus an `instruction` for the main
agent describing how to use them.

### Editing the query

Edits are made against a version, not a guess:

1. The model calls `get_editor_state` and receives the buffer plus a `version`.
2. It passes that `version` to the editing tool.
3. If the user typed in the meantime the version no longer matches, the edit is
   rejected and the model is handed the fresh buffer to retry against.

So an edit planned against text the user has since changed is never applied —
typing during a turn cannot be clobbered.

Every applied edit is then validated: the resulting statements are checked with
`EXPLAIN SYNTAX` on the connected server (`POST /validate`), which catches
syntax errors, unknown tables and unknown columns without running anything. The
tool result carries a `validation` field, so a broken buffer is reported in the
step that broke it rather than when the user next hits Run.

The dropdown in the composer decides what happens before an edit lands. Under
**Ask before edits** the call is held, the diff is shown with Approve/Reject,
and the model's turn stays paused until you choose. Under **Always allow
edits** it applies and the diff is shown after the fact.

### Running queries

`run_query` executes the editor's contents through the same store as the Run
button, so results land in the console's own tabs and the user sees exactly
what ran. It cannot run SQL of its own: to try something, the model writes it
to the editor first. Passing `statement` (copied verbatim from the buffer)
highlights that one statement and runs it alone; text that is not already in
the editor is refused. It runs reads only — anything that writes is handed back
for the user to run themselves.

Because the results are already on screen in a table that sorts, pages and
exports, the system prompt tells the model not to reprint the rows in chat and
to summarise instead.

### Context and connections

Highlighting SQL in the editor attaches it to the next message as a pill, so
the model sees the statement you mean without you pasting it. "Fix with AI" on
a failed result uses the same mechanism, sending only the statement that failed
rather than the whole buffer.

Every chat request carries the active connection, so the assistant always reads
the database that is on screen. Switching data sources starts a fresh
conversation: its searches, the tables it named and the queries it ran all
belong to the connection they happened on.

### Stopping

Stopping a turn aborts the request, and everything the turn started hangs off
that signal: the model, the search sub-agent, each bash command and each sample
query. Tool calls left open are closed as stopped on both sides, so the next
message continues the conversation instead of failing on a call that never
came back.

## Start the application

Two ways to run it, depending on what you are doing.

**One process, production-style** — what [Quick start](#quick-start) uses:

```bash
pnpm start
```

Builds both apps, then serves everything from the API on
<http://localhost:8080>: `/` is the React console, `/api/*` is the API, and any
other path falls back to the app so deep links work. One origin, so no CORS.

**Two processes, with hot reload** — for development:

```bash
pnpm dev
```

The API runs on :8080 and Vite on :5173; open <http://localhost:5173>. Vite
forwards `/api/*` to the API, so the browser addresses it by the same path it
uses in production. Either app can be run on its own:

- `pnpm --filter @clickhouse-ai/api dev`
- `pnpm --filter @clickhouse-ai/web dev`

Both forms read `ANTHROPIC_API_KEY` the same way: inline, or from
`apps/api/.env`.

## Test the application

`pnpm test`

Other workspace scripts: `pnpm typecheck`, `pnpm build`.

## Agentic coding tool

This was built with **Claude Code** (Anthropic), using Opus. It wrote most of
the code under direction, and every decision here is one I can walk through:
the version-token edit protocol, the sandboxed search sub-agent, the
run-from-the-editor-only rule, and the trade-offs each of them makes.

## Next steps

What I would pick up next, in the order I would do it:

1. **Error states for the chat agent.** Failures currently surface as one red
   line under the transcript. A dropped stream, a 429, an overloaded model and
   a tool that threw all deserve different treatment — a retry on the turn that
   failed, rather than asking the user to resend.

2. **Memory for the search sub-agent.** Each search starts cold: it re-greps
   ground it covered a minute ago, and the plan it followed is thrown away with
   the tool result. Keeping its past plans per session — attachable to the
   next search's context — would make repeat questions about the same schema
   cheaper and more consistent, and would let the main agent cite what was
   already established instead of asking again.

3. **Virtualization in the tree renderer.** The explorer renders every database
   and table node it is given. Northwind has eight tables; a real ClickHouse
   cluster has thousands, and the tree should render only what is on screen.

4. **Compaction of the chat.** Every turn resends the whole conversation,
   including tool outputs that are large by nature — schema search results,
   sampled rows, the editor buffer at several versions. Summarising older turns
   would keep long sessions inside the context window and cut the cost of each
   message.

5. **RAG over the schema.** Grep finds a column when the name or its comment
   shares a word with the question. Embedding table and column names, types and
   comments and retrieving by similarity would catch the cases it misses —
   `ship_country` for "where did we sell", `freight` for "delivery cost" — and
   would scale to schemas too wide to walk with a shell.
