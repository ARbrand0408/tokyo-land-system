import { api } from './client';
import type {
  ItemResponse,
  ListResponse,
  Proposal,
  ProposalInput,
  PublicProposal,
  PublicProposalMeta,
} from './types';

export function listProposals() {
  return api.get<ListResponse<Proposal>>('/api/proposals');
}

export function listRecentProposals(limit = 5) {
  return api.get<ItemResponse<Proposal[]>>(`/api/proposals/recent/list?limit=${limit}`);
}

export function getProposal(id: string) {
  return api.get<ItemResponse<Proposal>>(`/api/proposals/${id}`);
}

export function createProposal(input: ProposalInput) {
  return api.post<ItemResponse<Proposal>>('/api/proposals', input);
}

export function updateProposal(id: string, input: Partial<ProposalInput>) {
  return api.put<ItemResponse<Proposal>>(`/api/proposals/${id}`, input);
}

export function deleteProposal(id: string) {
  return api.delete<{ ok: boolean }>(`/api/proposals/${id}`);
}

const BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3001';

export type PublicProposalError = {
  code: 'CODE_REQUIRED' | 'CODE_MISMATCH' | 'NOT_FOUND' | 'UNKNOWN';
  status: number;
  message: string;
};

export async function fetchPublicProposalMeta(slug: string): Promise<PublicProposalMeta> {
  const res = await fetch(`${BASE_URL}/api/p/${encodeURIComponent(slug)}/meta`);
  if (!res.ok) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    throw {
      code: (payload.code as PublicProposalError['code']) ?? 'UNKNOWN',
      status: res.status,
      message: payload.error ?? `${res.status} ${res.statusText}`,
    } satisfies PublicProposalError;
  }
  const body = (await res.json()) as ItemResponse<PublicProposalMeta>;
  return body.data;
}

export async function fetchPublicProposal(slug: string, code: string): Promise<PublicProposal> {
  const res = await fetch(`${BASE_URL}/api/p/${encodeURIComponent(slug)}`, {
    headers: { 'X-Access-Code': code },
  });
  if (!res.ok) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    throw {
      code: (payload.code as PublicProposalError['code']) ?? 'UNKNOWN',
      status: res.status,
      message: payload.error ?? `${res.status} ${res.statusText}`,
    } satisfies PublicProposalError;
  }
  const body = (await res.json()) as ItemResponse<PublicProposal>;
  return body.data;
}
