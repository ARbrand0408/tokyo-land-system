import { api } from './client';
import type {
  CustomerDetail,
  CustomerInput,
  CustomerListItem,
  ItemResponse,
  ListResponse,
  Customer,
} from './types';

export function listCustomers() {
  return api.get<ListResponse<CustomerListItem>>('/api/customers');
}

export function getCustomer(id: string) {
  return api.get<ItemResponse<CustomerDetail>>(`/api/customers/${id}`);
}

export function createCustomer(input: CustomerInput) {
  return api.post<ItemResponse<Customer>>('/api/customers', input);
}

export function updateCustomer(id: string, input: CustomerInput) {
  return api.put<ItemResponse<Customer>>(`/api/customers/${id}`, input);
}

export function deleteCustomer(id: string) {
  return api.delete<{ ok: boolean }>(`/api/customers/${id}`);
}
