import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { env } from './env.js';
import { chatRoutes } from './routes/chat.js';
import { connectionRoutes } from './routes/connections.js';
import { describeRoutes } from './routes/describe.js';
import { queryRoutes } from './routes/query.js';
import { schemaRoutes } from './routes/schema.js';
import { validateRoutes } from './routes/validate.js';

const app = new Hono();

app.use('/*', cors({ origin: env.WEB_ORIGIN }));

// define a route handler for the default home page
app.get('/', (c) => c.text('Hello world!'));

app.route('/', chatRoutes);
app.route('/', connectionRoutes);
app.route('/', describeRoutes);
app.route('/', queryRoutes);
app.route('/', schemaRoutes);
app.route('/', validateRoutes);

export default app;
