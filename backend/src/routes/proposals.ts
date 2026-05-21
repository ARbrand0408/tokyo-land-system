import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { prisma } from '../db.js';

export const proposalsRoute = new Hono();

proposalsRoute.get('/', async (c) => {
  const proposals = await prisma.proposal.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, companyName: true, accessCode: true } },
      items: { include: { property: true }, orderBy: { order: 'asc' } },
    },
  });
  return c.json({ data: proposals, count: proposals.length });
});

proposalsRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { property: true }, orderBy: { order: 'asc' } },
    },
  });
  if (!proposal) return c.json({ error: 'Proposal not found' }, 404);
  return c.json({ data: proposal });
});

function newSlug() {
  return randomBytes(5).toString('base64url').slice(0, 8).toLowerCase();
}

proposalsRoute.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.customerId) return c.json({ error: 'customerId が必要です' }, 400);

  const customer = await prisma.customer.findUnique({ where: { id: body.customerId } });
  if (!customer) return c.json({ error: '指定された customerId が存在しません' }, 404);

  const propertyIds: string[] = Array.isArray(body.propertyIds) ? body.propertyIds : [];
  if (propertyIds.length > 0) {
    const found = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true },
    });
    if (found.length !== propertyIds.length) {
      return c.json({ error: '無効な propertyId が含まれています' }, 400);
    }
  }

  const proposal = await prisma.proposal.create({
    data: {
      slug: newSlug(),
      customerId: body.customerId,
      title: body.title ?? null,
      message: body.message ?? null,
      status: body.status ?? '下書き',
      items: {
        create: propertyIds.map((propertyId, idx) => ({
          propertyId,
          order: idx,
        })),
      },
    },
    include: {
      customer: { select: { id: true, name: true, companyName: true, accessCode: true } },
      items: { include: { property: true }, orderBy: { order: 'asc' } },
    },
  });

  return c.json({ data: proposal }, 201);
});

proposalsRoute.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    const propertyIds: string[] = Array.isArray(body.propertyIds) ? body.propertyIds : [];

    if (propertyIds.length > 0) {
      const found = await prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true },
      });
      if (found.length !== propertyIds.length) {
        return c.json({ error: '無効な propertyId が含まれています' }, 400);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {};
      if (body.title !== undefined) data.title = body.title ?? null;
      if (body.message !== undefined) data.message = body.message ?? null;
      if (body.status !== undefined) data.status = body.status;
      if (body.customerId !== undefined) data.customerId = body.customerId;
      await tx.proposal.update({ where: { id }, data });

      if (Array.isArray(body.propertyIds)) {
        await tx.proposalItem.deleteMany({ where: { proposalId: id } });
        if (propertyIds.length > 0) {
          await tx.proposalItem.createMany({
            data: propertyIds.map((propertyId, idx) => ({
              proposalId: id,
              propertyId,
              order: idx,
            })),
          });
        }
      }

      return tx.proposal.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, name: true, companyName: true, accessCode: true } },
          items: { include: { property: true }, orderBy: { order: 'asc' } },
        },
      });
    });

    return c.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

proposalsRoute.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await prisma.proposal.delete({ where: { id } });
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

// ダッシュボード用: 最近の提案
proposalsRoute.get('/recent/list', async (c) => {
  const limit = Number(c.req.query('limit') ?? '5');
  const proposals = await prisma.proposal.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      customer: { select: { id: true, name: true } },
      items: { select: { id: true } },
    },
  });
  return c.json({ data: proposals });
});
