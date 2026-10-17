import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { env } from './env.js';
import { WEB_DIST, webAppRoot } from './lib/webApp.js';
import { chatRoutes } from './routes/chat.js';
import { connectionRoutes } from './routes/connections.js';
import { describeRoutes } from './routes/describe.js';
import { queryRoutes } from './routes/query.js';
import { schemaRoutes } from './routes/schema.js';
import { validateRoutes } from './routes/validate.js';

const app = new Hono();

// The browser only ever calls `/api/*`, in development through Vite's proxy
// and in production against this server, so the two environments address the
// API identically.
const api = new Hono();

api.use('/*', cors({ origin: env.WEB_ORIGIN }));

api.route('/', chatRoutes);
api.route('/', connectionRoutes);
api.route('/', describeRoutes);
api.route('/', queryRoutes);
api.route('/', schemaRoutes);
api.route('/', validateRoutes);

app.route('/api', api);

/**
 * The built console, served from the API so production is one process.
 *
 * Only mounted when `apps/web/dist` exists: in development the app is served
 * by Vite, and a missing build should say so rather than 404.
 */
const root = webAppRoot();

if (root) {
  app.use('/*', serveStatic({ root }));

  // Anything left is a client-side route, which the SPA resolves itself.
  app.get('/*', serveStatic({ root, path: 'index.html' }));
} else {
  app.get('/', (c) =>
    c.text(
      `No web build at ${WEB_DIST}. Run \`pnpm build\` to serve the console from here, ` +
        `or \`pnpm dev\` to run it on Vite.`,
      503,
    ),
  );
}

export default app;
