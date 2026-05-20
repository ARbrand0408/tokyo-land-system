import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// MOCK: stand-in for S3-compatible object storage (R2 / MinIO / S3 etc).
// Writes uploads to backend/uploads/ and returns a URL pointing at the
// /uploads/:id static route. Swap the persistence block below for an
// AWS SDK PutObjectCommand once a real bucket is provisioned.

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const ALLOWED_KINDS = ['property_image', 'floor_plan'] as const;
type UploadKind = (typeof ALLOWED_KINDS)[number];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const uploadRoute = new Hono();

uploadRoute.post('/', async (c) => {
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.startsWith('multipart/form-data')) {
    return c.json({ error: 'Content-Type must be multipart/form-data' }, 400);
  }

  const form = await c.req.formData();
  const file = form.get('file');
  const kindValue = form.get('kind');

  if (!(file instanceof File)) {
    return c.json({ error: 'file field is required' }, 400);
  }
  if (typeof kindValue !== 'string' || !ALLOWED_KINDS.includes(kindValue as UploadKind)) {
    return c.json(
      { error: `kind must be one of: ${ALLOWED_KINDS.join(', ')}` },
      400,
    );
  }
  if (file.size > MAX_BYTES) {
    return c.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024}MB)` }, 413);
  }
  if (!file.type.startsWith('image/')) {
    return c.json({ error: 'Only image uploads are supported' }, 415);
  }

  const id = randomUUID();
  const ext = path.extname(file.name) || mimeToExt(file.type);
  const key = `${kindValue}/${id}${ext}`;
  const absPath = path.join(UPLOAD_DIR, key);

  if (!existsSync(path.dirname(absPath))) {
    await mkdir(path.dirname(absPath), { recursive: true });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  // In production this URL would be the S3/CloudFront public URL.
  const url = `${publicBaseUrl(c.req.header('host'))}/uploads/${key}`;

  return c.json(
    {
      data: {
        id,
        url,
        kind: kindValue,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        storage: 's3-mock',
        uploadedAt: new Date().toISOString(),
      },
    },
    201,
  );
});

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
}

function publicBaseUrl(host: string | undefined): string {
  return host ? `http://${host}` : 'http://localhost:3001';
}
