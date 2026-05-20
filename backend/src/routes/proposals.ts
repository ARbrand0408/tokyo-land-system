import { Hono } from 'hono';
import { randomBytes, randomInt } from 'node:crypto';
import { prisma } from '../db.js';

export const proposalsRoute = new Hono();

// 担当者用: 提案一覧
proposalsRoute.get('/', async (c) => {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      items: { include: { property: true }, orderBy: { order: 'asc' } },
    },
  });
  return c.json({ data: proposals, count: proposals.length });
});

// 担当者用: 提案発行
proposalsRoute.post('/', async (c) => {
  const body = await c.req.json();

  if (!body.customerId || !Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ error: 'customerId と 1件以上の items が必要です' }, 400);
  }

  const customer = await prisma.customer.findUnique({ where: { id: body.customerId } });
  if (!customer) return c.json({ error: '指定された customerId が存在しません' }, 404);

  // 各 item に有効な propertyId が含まれているか確認
  const propertyIds: string[] = body.items.map((i: { propertyId: string }) => i.propertyId);
  const found = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    select: { id: true },
  });
  if (found.length !== propertyIds.length) {
    return c.json({ error: '無効な propertyId が含まれています' }, 400);
  }

  const slug = randomBytes(5).toString('base64url').slice(0, 8).toLowerCase();
  const pin = randomInt(0, 10000).toString().padStart(4, '0');

  const proposal = await prisma.proposal.create({
    data: {
      slug,
      pin,
      customerId: body.customerId,
      title: body.title ?? null,
      message: body.message ?? null,
      items: {
        create: body.items.map(
          (
            item: {
              propertyId: string;
              propertyImageUrl?: string | null;
              floorPlanUrl?: string | null;
              comment?: string | null;
            },
            index: number,
          ) => ({
            propertyId: item.propertyId,
            propertyImageUrl: item.propertyImageUrl ?? null,
            floorPlanUrl: item.floorPlanUrl ?? null,
            comment: item.comment ?? null,
            order: index,
          }),
        ),
      },
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      items: { include: { property: true } },
    },
  });

  return c.json({ data: proposal }, 201);
});
