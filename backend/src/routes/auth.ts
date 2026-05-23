import { Hono } from 'hono';
import { prisma } from '../db.js';
import { signJwt, verifyPassword } from '../lib/auth.js';
import { requireAuth, type AdminContext } from '../middleware/requireAuth.js';

export const authRoute = new Hono<AdminContext>();

// 管理者ログイン
authRoute.post('/login', async (c) => {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'リクエストが不正です' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return c.json({ error: 'メールアドレスとパスワードを入力してください' }, 400);
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return c.json({ error: 'メールアドレスまたはパスワードが違います' }, 401);
  }

  const token = signJwt({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  return c.json({
    data: {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    },
  });
});

// 現在のログインユーザー情報
authRoute.get('/me', requireAuth, (c) => {
  const admin = c.get('admin');
  return c.json({
    data: {
      id: admin.sub,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});
