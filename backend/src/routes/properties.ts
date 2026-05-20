import { Hono } from 'hono';
import { prisma } from '../db.js';

export const propertiesRoute = new Hono();

propertiesRoute.get('/', async (c) => {
  const properties = await prisma.property.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return c.json({ data: properties, count: properties.length });
});

propertiesRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return c.json({ error: 'Property not found' }, 404);
  return c.json({ data: property });
});

propertiesRoute.post('/', async (c) => {
  const body = await c.req.json();

  if (
    !body.code ||
    !body.name ||
    !body.area ||
    !body.address ||
    !body.type ||
    !body.rooms ||
    body.sizeSqm === undefined ||
    !body.vacancy ||
    !body.status
  ) {
    return c.json(
      {
        error:
          'Missing required fields: code, name, area, address, type, rooms, sizeSqm, vacancy, status',
      },
      400,
    );
  }

  try {
    const property = await prisma.property.create({
      data: {
        code: body.code,
        name: body.name,
        area: body.area,
        address: body.address,
        type: body.type,
        rooms: body.rooms,
        sizeSqm: Number(body.sizeSqm),
        rent: body.rent ?? null,
        price: body.price ?? null,
        builtYear: body.builtYear ?? null,
        vacancy: body.vacancy,
        status: body.status,
        description: body.description ?? null,
      },
    });
    return c.json({ data: property }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});
