import { api } from './client';
import type {
  CreateProposalInput,
  ItemResponse,
  Proposal,
  PublicProposal,
} from './types';

export function createProposal(input: CreateProposalInput) {
  return api.post<ItemResponse<Proposal>>('/api/proposals', input);
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export type PublicProposalError = {
  code: 'PIN_REQUIRED' | 'PIN_MISMATCH' | 'NOT_FOUND' | 'EXPIRED' | 'UNKNOWN';
  status: number;
  message: string;
};

export async function fetchPublicProposal(
  slug: string,
  pin: string,
): Promise<PublicProposal> {
  const res = await fetch(`${BASE_URL}/api/p/${encodeURIComponent(slug)}`, {
    headers: { 'X-Proposal-Pin': pin },
  });

  if (!res.ok) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    const err: PublicProposalError = {
      code: (payload.code as PublicProposalError['code']) ?? 'UNKNOWN',
      status: res.status,
      message: payload.error ?? `${res.status} ${res.statusText}`,
    };
    throw err;
  }

  const body = (await res.json()) as ItemResponse<PublicProposal>;
  return body.data;
}
