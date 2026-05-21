import { api } from './client';
import type { ItemResponse, ListResponse, Property, PropertyInput, PropertyStatus } from './types';

export function listProperties() {
  return api.get<ListResponse<Property>>('/api/properties');
}

export function getProperty(id: string) {
  return api.get<ItemResponse<Property>>(`/api/properties/${id}`);
}

export function createProperty(input: PropertyInput) {
  return api.post<ItemResponse<Property>>('/api/properties', input);
}

export function updateProperty(id: string, input: PropertyInput) {
  return api.put<ItemResponse<Property>>(`/api/properties/${id}`, input);
}

export function duplicateProperty(id: string) {
  return api.post<ItemResponse<Property>>(`/api/properties/${id}/duplicate`, {});
}

export function deleteProperty(id: string) {
  return api.delete<{ ok: boolean }>(`/api/properties/${id}`);
}

export function setPropertyStatus(id: string, status: PropertyStatus) {
  return api.patch<ItemResponse<Property>>(`/api/properties/${id}/status`, { status });
}

export type PdfExtractionResponse = {
  data: {
    extracted: PropertyInput;
    matchedFields: string[];
    rawText: string;
  };
};

export function extractPropertyFromPdf(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api.upload<PdfExtractionResponse>('/api/properties/extract-from-pdf', formData);
}
