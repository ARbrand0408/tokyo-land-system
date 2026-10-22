import { Hono } from 'hono';
import { prisma } from '../db.js';

// お客様向けの公開エンドポイント。
// 顧客のアクセスコード(4桁)で認証する。
// 認証はクエリ ?code= または X-Access-Code ヘッダー どちらでも可。
// 送信済みの提案のみ公開。物件は status=公開 のみ返す。

export const publicProposalsRoute = new Hono();

// 提案メタ情報のみ (顧客名表示用 / 認証前)
publicProposalsRoute.get('/:slug/meta', async (c) => {
  const slug = c.req.param('slug');
  const proposal = await prisma.proposal.findUnique({
    where: { slug },
    include: { customer: { select: { name: true, companyName: true } } },
  });
  if (!proposal) {
    return c.json({ error: '提案が見つかりません', code: 'NOT_FOUND' }, 404);
  }
  // 存在しない場合と同じ code を返し、下書きの存在を外部から区別できないようにする
  if (proposal.status !== '送信済み') {
    return c.json({ error: 'この提案は現在公開されていません', code: 'NOT_FOUND' }, 404);
  }
  return c.json({
    data: {
      slug: proposal.slug,
      customerName: proposal.customer.name,
      companyName: proposal.customer.companyName,
    },
  });
});

// 提案の本文 (認証必須)
publicProposalsRoute.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const code = c.req.header('x-access-code') ?? c.req.query('code');

  if (!code) {
    return c.json({ error: 'アクセスコードを入力してください', code: 'CODE_REQUIRED' }, 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { slug },
    include: {
      customer: true,
      items: { where: { property: { status: '公開' } }, include: { property: true }, orderBy: { order: 'asc' } },
    },
  });

  if (!proposal) {
    return c.json({ error: '提案が見つかりません', code: 'NOT_FOUND' }, 404);
  }

  // コード照合より前に判定し、下書きの提案に PIN 総当たりの手がかりを与えない
  if (proposal.status !== '送信済み') {
    return c.json({ error: 'この提案は現在公開されていません', code: 'NOT_FOUND' }, 404);
  }

  if (proposal.customer.accessCode !== code) {
    return c.json({ error: 'アクセスコードが一致しません', code: 'CODE_MISMATCH' }, 401);
  }

  return c.json({
    data: {
      id: proposal.id,
      slug: proposal.slug,
      title: proposal.title,
      message: proposal.message,
      status: proposal.status,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      customer: {
        name: proposal.customer.name,
        companyName: proposal.customer.companyName,
      },
      items: proposal.items,
    },
  });
});
