import { clearSession, getToken } from '../lib/auth';

const BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// /api/p/* (お客様向け公開ページ) と /api/auth/login は JWT を付けない。
// それ以外の管理画面 API には Authorization ヘッダを自動付与する。
function shouldAttachToken(path: string): boolean {
  if (path.startsWith('/api/p/') || path === '/api/p') return false;
  if (path === '/api/auth/login') return false;
  return path.startsWith('/api/');
}

function buildHeaders(path: string, init?: RequestInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (shouldAttachToken(path)) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(path, init),
  });
  if (!res.ok) {
    if (res.status === 401 && shouldAttachToken(path)) {
      clearSession();
    }
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error ?? body?.message ?? '';
    } catch {
      // ignore
    }
    throw new ApiError(
      `${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const headers: Record<string, string> = {};
    if (shouldAttachToken(path)) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      if (res.status === 401 && shouldAttachToken(path)) {
        clearSession();
      }
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.error ?? body?.message ?? '';
      } catch {
        // ignore
      }
      throw new ApiError(
        `${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`,
        res.status,
      );
    }
    return res.json() as Promise<T>;
  },
};

export const apiBaseUrl = BASE_URL;
