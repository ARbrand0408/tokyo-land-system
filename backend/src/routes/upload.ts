import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { CLOUDINARY_FOLDER, uploadBufferToCloudinary } from '../lib/cloudinary.js';

// 画像はすべて Cloudinary に保存する。
// 認証情報は backend/src/lib/cloudinary.ts が環境変数から読み込む。

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
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadBufferToCloudinary(buffer, {
      folder: `${CLOUDINARY_FOLDER}/${kindValue}`,
      publicId: id,
      resourceType: 'image',
    });

    return c.json(
      {
        data: {
          id: result.public_id,
          url: result.secure_url,
          kind: kindValue,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          storage: 'cloudinary',
          uploadedAt: new Date().toISOString(),
        },
      },
      201,
    );
  } catch (err) {
    console.error('[upload] Cloudinary upload failed', err);
    const message = err instanceof Error ? err.message : 'Cloudinary upload failed';
    return c.json({ error: 'Upload failed', message }, 502);
  }
});
