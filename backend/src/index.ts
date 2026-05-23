import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { customersRoute } from './routes/customers.js';
import { propertiesRoute } from './routes/properties.js';
import { uploadRoute } from './routes/upload.js';
import { proposalsRoute } from './routes/proposals.js';
import { publicProposalsRoute } from './routes/publicProposals.js';
import { authRoute } from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';

const app = new Hono();

// 許可するフロントエンドのオリジン。
//   - 開発時のデフォルト: localhost:5173 / 127.0.0.1:5173 / すべての *.vercel.app
//   - 本番: ALLOWED_ORIGINS にカンマ区切りで設定 (例: https://app.example.com,https://www.example.com)
//   - ALLOWED_ORIGINS に "*" を含めるとすべてのオリジンを許可
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOW_ALL_ORIGINS = ALLOWED_ORIGINS.includes('*');

const resolveOrigin = (origin: string): string | null => {
  if (ALLOW_ALL_ORIGINS) return origin || '*';
  if (!origin) return null;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Vercel のプロダクション / プレビューデプロイメントを許可
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return origin;
  return null;
};

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: resolveOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Access-Code'],
  }),
);

app.get('/', (c) =>
  c.json({
    name: 'TOKYO LAND API',
    version: '0.2.0',
    endpoints: [
      '/api/auth/login',
      '/api/auth/me',
      '/api/customers',
      '/api/properties',
      '/api/upload',
      '/api/proposals',
      '/api/p/:slug',
    ],
  }),
);

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 認証関連 (ログインは public, /me だけ JWT 必須)
app.route('/api/auth', authRoute);

// お客様向け公開エンドポイント (PIN コードで認証)
app.route('/api/p', publicProposalsRoute);

// 管理画面用エンドポイント - JWT 認証必須
// (各ルートの中で requireAuth を適用しても良いが、
//  ここで一括して保護する方が抜け漏れが少ない)
const adminApi = new Hono();
adminApi.use('*', requireAuth);
adminApi.route('/customers', customersRoute);
adminApi.route('/properties', propertiesRoute);
adminApi.route('/upload', uploadRoute);
adminApi.route('/proposals', proposalsRoute);
app.route('/api', adminApi);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    '[warn] Cloudinary credentials are not fully set. Image uploads will fail until CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are configured.',
  );
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.warn(
    '[warn] JWT_SECRET is not set or too short. Admin login will fail until JWT_SECRET (>=16 chars) is configured.',
  );
}

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`TOKYO LAND API ready at http://localhost:${info.port}`);
});
