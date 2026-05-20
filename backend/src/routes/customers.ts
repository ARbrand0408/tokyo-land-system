import { Hono } from 'hono';
import { prisma } from '../db.js';

export const customersRoute = new Hono();

customersRoute.get('/', async (c) => {
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return c.json({ data: customers, count: customers.length });
});

customersRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return c.json({ error: 'Customer not found' }, 404);
  return c.json({ data: customer });
});

customersRoute.post('/', async (c) => {
  const body = await c.req.json();

  if (!body.code || !body.name || !body.nameKana || !body.assignedTo || !body.status) {
    return c.json(
      { error: 'Missing required fields: code, name, nameKana, assignedTo, status' },
      400,
    );
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        code: body.code,
        name: body.name,
        nameKana: body.nameKana,
        phone: body.phone ?? null,
        email: body.email ?? null,
        assignedTo: body.assignedTo,
        status: body.status,
        desiredArea: body.desiredArea ?? null,
        desiredRooms: body.desiredRooms ?? null,
        budgetMin: body.budgetMin ?? null,
        budgetMax: body.budgetMax ?? null,
        notes: body.notes ?? null,
        lastContactedAt: body.lastContactedAt ? new Date(body.lastContactedAt) : null,
      },
    });
    return c.json({ data: customer }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});
