import { api } from './client';
import type { Customer, ItemResponse, ListResponse } from './types';

export function listCustomers() {
  return api.get<ListResponse<Customer>>('/api/customers');
}

export function getCustomer(id: string) {
  return api.get<ItemResponse<Customer>>(`/api/customers/${id}`);
}

export function createCustomer(input: Partial<Customer>) {
  return api.post<ItemResponse<Customer>>('/api/customers', input);
}
