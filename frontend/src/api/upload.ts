import { api } from './client';
import type { UploadKind, UploadedAsset } from './types';

export function uploadAsset(file: File, kind: UploadKind) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);
  return api.upload<{ data: UploadedAsset }>('/api/upload', formData);
}
