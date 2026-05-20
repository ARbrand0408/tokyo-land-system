import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { customersRoute } from './routes/customers.js';
import { propertiesRoute } from './routes/properties.js';
import { uploadRoute } from './routes/upload.js';
import { proposalsRoute } from './routes/proposals.js';
import { publicProposalsRoute } from './routes/publicProposals.js';

const app = new Hono();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Proposal-Pin'],
  }),
);
app.use(
  '/uploads/*',
  cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET'],
  }),
);

app.get('/', (c) =>
  c.json({
    name: 'TOKYO LAND API',
    version: '0.1.0',
    endpoints: [
      '/api/customers',
      '/api/properties',
      '/api/upload',
      '/api/proposals',
      '/api/p/:slug',
    ],
  }),
);

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/customers', customersRoute);
app.route('/api/properties', propertiesRoute);
app.route('/api/upload', uploadRoute);
app.route('/api/proposals', proposalsRoute);
app.route('/api/p', publicProposalsRoute);

// Serve uploaded files (mock S3 storage).
app.use('/uploads/*', serveStatic({ root: './' }));

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`TOKYO LAND API ready at http://localhost:${info.port}`);
});
