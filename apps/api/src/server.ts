import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { env } from './env.js';
import { connectionRoutes } from './routes/connections.js';
import { queryRoutes } from './routes/query.js';
import { schemaRoutes } from './routes/schema.js';

const app = new Hono();

app.use('/*', cors({ origin: env.WEB_ORIGIN }));

// define a route handler for the default home page
app.get('/', (c) => c.text('Hello world!'));

app.route('/', connectionRoutes);
app.route('/', queryRoutes);
app.route('/', schemaRoutes);

export default app;
