import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

// 認証情報は環境変数からのみ読み込む。コードや設定ファイルに値を書かないこと。
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
//   CLOUDINARY_UPLOAD_FOLDER (任意, デフォルト: 'tokyo-land')
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_FOLDER,
} = process.env;

let configured = false;

export function ensureCloudinaryConfigured(): void {
  if (configured) return;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in environment variables.',
    );
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export const CLOUDINARY_FOLDER = CLOUDINARY_UPLOAD_FOLDER ?? 'tokyo-land';

export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder: string; publicId?: string; resourceType?: 'image' | 'auto' },
): Promise<UploadApiResponse> {
  ensureCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType ?? 'image',
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result) return reject(new Error('Cloudinary upload returned empty result'));
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}
