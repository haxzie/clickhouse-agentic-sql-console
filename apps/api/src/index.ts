import { serve } from '@hono/node-server';

import { runMigrations } from './db/client.js';
import { env } from './env.js';
import { seedDefaultConnection } from './lib/connections.js';
import app from './server.js';

runMigrations();
seedDefaultConnection();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`server started at http://localhost:${info.port}`);
});
