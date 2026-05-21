import { Hono } from 'hono';
import { prisma } from '../db.js';

export const propertiesRoute = new Hono();

// 物件保存に共通するフィールド整形
type JsonInput = Parameters<typeof prisma.property.create>[0]['data']['stations'];

function asJson(value: unknown): JsonInput {
  if (value == null) return [] as unknown as JsonInput;
  return value as JsonInput;
}

function buildData(body: Record<string, unknown>) {
  return {
    name: body.name as string,
    propertyType: (body.propertyType as string) ?? '賃貸マンション',
    area: (body.area as string) ?? '',
    address: (body.address as string) ?? null,
    stations: asJson(body.stations),
    highlights: asJson(body.highlights),
    rooms: (body.rooms as string) ?? null,
    sizeSqm: body.sizeSqm == null || body.sizeSqm === '' ? null : Number(body.sizeSqm),
    terraceSqm: body.terraceSqm == null || body.terraceSqm === '' ? null : Number(body.terraceSqm),
    floor: body.floor == null || body.floor === '' ? null : Number(body.floor),
    totalFloors: body.totalFloors == null || body.totalFloors === '' ? null : Number(body.totalFloors),
    basementFloors:
      body.basementFloors == null || body.basementFloors === '' ? null : Number(body.basementFloors),
    builtYearMonth: (body.builtYearMonth as string) ?? null,
    structure: (body.structure as string) ?? null,
    totalUnits: body.totalUnits == null || body.totalUnits === '' ? null : Number(body.totalUnits),
    mainLight: (body.mainLight as string) ?? null,
    availableFrom: (body.availableFrom as string) ?? null,
    rent: body.rent == null || body.rent === '' ? null : Number(body.rent),
    maintenanceFee:
      body.maintenanceFee == null || body.maintenanceFee === '' ? null : Number(body.maintenanceFee),
    deposit: (body.deposit as string) ?? null,
    keyMoney: (body.keyMoney as string) ?? null,
    brokerFee: (body.brokerFee as string) ?? null,
    renewalFee: (body.renewalFee as string) ?? null,
    contractTerm: (body.contractTerm as string) ?? null,
    cancelNotice: (body.cancelNotice as string) ?? null,
    insurance: (body.insurance as string) ?? null,
    guarantor: (body.guarantor as string) ?? null,
    officeUse: (body.officeUse as string) ?? null,
    sohoUse: (body.sohoUse as string) ?? null,
    pets: (body.pets as string) ?? null,
    instruments: (body.instruments as string) ?? null,
    smoking: (body.smoking as string) ?? null,
    currentStatus: (body.currentStatus as string) ?? null,
    parking: (body.parking as string) ?? null,
    parkingFee: (body.parkingFee as string) ?? null,
    description: (body.description as string) ?? null,
    facilities: asJson(body.facilities),
    images: asJson(body.images),
    floorPlanUrl: (body.floorPlanUrl as string) ?? null,
    status: (body.status as string) ?? '下書き',
  };
}

propertiesRoute.get('/', async (c) => {
  const properties = await prisma.property.findMany({ orderBy: { updatedAt: 'desc' } });
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
  if (!body.name) return c.json({ error: '物件名は必須です' }, 400);
  try {
    const property = await prisma.property.create({ data: buildData(body) });
    return c.json({ data: property }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

propertiesRoute.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    const property = await prisma.property.update({ where: { id }, data: buildData(body) });
    return c.json({ data: property });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

// 複製
propertiesRoute.post('/:id/duplicate', async (c) => {
  const id = c.req.param('id');
  const src = await prisma.property.findUnique({ where: { id } });
  if (!src) return c.json({ error: 'Property not found' }, 404);
  const copy = await prisma.property.create({
    data: buildData({
      ...src,
      stations: src.stations ?? [],
      highlights: src.highlights ?? [],
      facilities: src.facilities ?? [],
      images: src.images ?? [],
      name: `${src.name} (コピー)`,
      status: '下書き',
    } as unknown as Record<string, unknown>),
  });
  return c.json({ data: copy }, 201);
});

propertiesRoute.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await prisma.property.delete({ where: { id } });
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

propertiesRoute.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    const property = await prisma.property.update({
      where: { id },
      data: { status: body.status },
    });
    return c.json({ data: property });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});
