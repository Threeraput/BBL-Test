import { apiClient } from './client.ts';

export interface Collection {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export const collectionsApi = {
  getCollections: (token: string) => 
    apiClient<Collection[]>('/collections', { token }),
    
  createCollection: (token: string, name: string) => 
    apiClient<Collection>('/collections', { method: 'POST', body: { name }, token }),
    
  updateCollection: (token: string, id: string, name: string) => 
    apiClient<Collection>(`/collections/${id}`, { method: 'PATCH', body: { name }, token }),
    
  deleteCollection: (token: string, id: string) => 
    apiClient<void>(`/collections/${id}`, { method: 'DELETE', token }),
};
