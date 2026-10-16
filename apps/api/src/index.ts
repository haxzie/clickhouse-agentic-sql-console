import { serve } from '@hono/node-server';

import { env } from './env.js';
import app from './server.js';

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`server started at http://localhost:${info.port}`);
});
