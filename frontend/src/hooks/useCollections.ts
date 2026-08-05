import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { collectionsApi, type Collection } from '../api/collections.ts';

export const useCollections = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const data = await collectionsApi.getCollections(token);
      setCollections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collections');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessTokenSilently]);

  const createCollection = async (name: string) => {
    try {
      const token = await getAccessTokenSilently();
      await collectionsApi.createCollection(token, name);
      await fetchCollections(); // Refresh list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create collection');
    }
  };

  const updateCollection = async (id: string, name: string) => {
    try {
      const token = await getAccessTokenSilently();
      await collectionsApi.updateCollection(token, id, name);
      await fetchCollections();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update collection');
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const token = await getAccessTokenSilently();
      await collectionsApi.deleteCollection(token, id);
      await fetchCollections();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete collection');
    }
  };

  return {
    collections,
    isLoading,
    error,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  };
};
