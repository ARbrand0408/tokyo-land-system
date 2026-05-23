import type { Context, Next } from 'hono';
import { verifyJwt, type JwtPayload } from '../lib/auth.js';

// JWT 認証ミドルウェア。
// Authorization: Bearer <token> を要求し、payload を c.set('admin', ...) に格納する。

export type AdminContext = {
  Variables: {
    admin: JwtPayload;
  };
};

export async function requireAuth(c: Context, next: Next) {
  const header = c.req.header('authorization') ?? c.req.header('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return c.json({ error: 'ログインが必要です', code: 'UNAUTHENTICATED' }, 401);
  }
  const token = header.slice(7).trim();
  const payload = verifyJwt(token);
  if (!payload) {
    return c.json({ error: 'セッションの有効期限が切れました', code: 'INVALID_TOKEN' }, 401);
  }
  c.set('admin', payload);
  await next();
}
