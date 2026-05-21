import { Hono } from 'hono';
import { randomInt } from 'node:crypto';
import { prisma } from '../db.js';

export const customersRoute = new Hono();

async function generateAccessCode(): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const code = randomInt(0, 10000).toString().padStart(4, '0');
    const existing = await prisma.customer.findUnique({ where: { accessCode: code } });
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique access code');
}

customersRoute.get('/', async (c) => {
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      proposals: {
        select: { id: true, status: true },
      },
    },
  });
  const data = customers.map((cust) => ({
    ...cust,
    proposalCount: cust.proposals.length,
    sentCount: cust.proposals.filter((p) => p.status === '送信済み').length,
  }));
  return c.json({ data, count: data.length });
});

customersRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      proposals: {
        orderBy: { updatedAt: 'desc' },
        include: {
          items: {
            include: { property: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
  if (!customer) return c.json({ error: 'Customer not found' }, 404);
  return c.json({ data: customer });
});

customersRoute.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.name) {
    return c.json({ error: '顧客名は必須です' }, 400);
  }
  try {
    const accessCode = body.accessCode ?? (await generateAccessCode());
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        companyName: body.companyName ?? null,
        accessCode,
        email: body.email ?? null,
        phone: body.phone ?? null,
        moveInDate: body.moveInDate ?? null,
        birthDate: body.birthDate ?? null,
        preferences: body.preferences ?? null,
        notes: body.notes ?? null,
      },
    });
    return c.json({ data: customer }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

customersRoute.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        companyName: body.companyName ?? null,
        accessCode: body.accessCode,
        email: body.email ?? null,
        phone: body.phone ?? null,
        moveInDate: body.moveInDate ?? null,
        birthDate: body.birthDate ?? null,
        preferences: body.preferences ?? null,
        notes: body.notes ?? null,
      },
    });
    return c.json({ data: customer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

customersRoute.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await prisma.customer.delete({ where: { id } });
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});
