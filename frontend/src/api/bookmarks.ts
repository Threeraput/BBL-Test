import { apiClient } from './client.ts';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  notes?: string;
  collectionId?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateBookmarkDto = Pick<Bookmark, 'url' | 'title' | 'notes' | 'collectionId'>;
export type UpdateBookmarkDto = Partial<CreateBookmarkDto>;

export const bookmarksApi = {
  getBookmarks: (token: string, collectionId?: string) => {
    const query = collectionId ? `?collectionId=${collectionId}` : '';
    return apiClient<Bookmark[]>(`/bookmarks${query}`, { token });
  },
    
  createBookmark: (token: string, data: CreateBookmarkDto) => 
    apiClient<Bookmark>('/bookmarks', { method: 'POST', body: data, token }),
    
  updateBookmark: (token: string, id: string, data: UpdateBookmarkDto) => 
    apiClient<Bookmark>(`/bookmarks/${id}`, { method: 'PATCH', body: data, token }),
    
  deleteBookmark: (token: string, id: string) => 
    apiClient<void>(`/bookmarks/${id}`, { method: 'DELETE', token }),
};
