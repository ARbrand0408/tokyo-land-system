import { api } from './client';
import type { ItemResponse, ListResponse, Property } from './types';

export function listProperties() {
  return api.get<ListResponse<Property>>('/api/properties');
}

export function getProperty(id: string) {
  return api.get<ItemResponse<Property>>(`/api/properties/${id}`);
}

export function createProperty(input: Partial<Property>) {
  return api.post<ItemResponse<Property>>('/api/properties', input);
}
