import { api } from './client';
import type { AuthUser } from '../lib/auth';

export type LoginResponse = {
  data: {
    token: string;
    user: AuthUser;
  };
};

export type MeResponse = { data: AuthUser };

export function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/api/auth/login', { email, password });
}

export function fetchMe(): Promise<MeResponse> {
  return api.get<MeResponse>('/api/auth/me');
}
