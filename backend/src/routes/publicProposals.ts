import { Hono } from 'hono';
import { prisma } from '../db.js';

// お客様向けの公開エンドポイント。
// PINチェックは X-Proposal-Pin ヘッダー または ?pin=xxxx クエリで受け付ける。
// 簡易PIN方式のため、レート制限や試行ロックはMVPでは未実装（要件追加時に追加）。

export const publicProposalsRoute = new Hono();

publicProposalsRoute.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const pin = c.req.header('x-proposal-pin') ?? c.req.query('pin');

  if (!pin) {
    return c.json({ error: 'PINコードを入力してください', code: 'PIN_REQUIRED' }, 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { slug },
    include: {
      customer: { select: { name: true, nameKana: true } },
      items: { include: { property: true }, orderBy: { order: 'asc' } },
    },
  });

  if (!proposal) {
    return c.json({ error: '提案が見つかりません', code: 'NOT_FOUND' }, 404);
  }

  if (proposal.pin !== pin) {
    return c.json({ error: 'PINコードが一致しません', code: 'PIN_MISMATCH' }, 401);
  }

  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    return c.json({ error: 'この提案は有効期限切れです', code: 'EXPIRED' }, 410);
  }

  // 公開レスポンスには pin を含めない
  const { pin: _pin, ...safe } = proposal;
  return c.json({ data: safe });
});
