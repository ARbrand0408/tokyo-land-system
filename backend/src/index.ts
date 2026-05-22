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

// 許可するフロントエンドのオリジン。
//   - 開発時のデフォルト: localhost:5173
//   - 本番: ALLOWED_ORIGINS にカンマ区切りで設定 (例: https://app.example.com,https://www.example.com)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Access-Code'],
  }),
);
app.use(
  '/uploads/*',
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET'],
  }),
);

app.get('/', (c) =>
  c.json({
    name: 'TOKYO LAND API',
    version: '0.2.0',
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
