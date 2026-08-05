import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { bookmarksApi, type Bookmark, type CreateBookmarkDto, type UpdateBookmarkDto } from '../api/bookmarks.ts';

export const useBookmarks = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async (collectionId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const data = await bookmarksApi.getBookmarks(token, collectionId);
      setBookmarks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessTokenSilently]);

  const createBookmark = async (data: CreateBookmarkDto, collectionIdFilter?: string) => {
    try {
      const token = await getAccessTokenSilently();
      await bookmarksApi.createBookmark(token, data);
      await fetchBookmarks(collectionIdFilter);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create bookmark');
    }
  };

  const updateBookmark = async (id: string, data: UpdateBookmarkDto, collectionIdFilter?: string) => {
    try {
      const token = await getAccessTokenSilently();
      await bookmarksApi.updateBookmark(token, id, data);
      await fetchBookmarks(collectionIdFilter);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update bookmark');
    }
  };

  const deleteBookmark = async (id: string, collectionIdFilter?: string) => {
    try {
      const token = await getAccessTokenSilently();
      await bookmarksApi.deleteBookmark(token, id);
      await fetchBookmarks(collectionIdFilter);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete bookmark');
    }
  };

  return {
    bookmarks,
    isLoading,
    error,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
  };
};
