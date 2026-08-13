import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys.js';

export const useSavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
      if (stored) setSavedSearches(JSON.parse(stored));
    } catch (err) {
      console.error('Failed to parse saved searches:', err);
    }
  }, []);

  const persistSearches = (searches) => {
    setSearchesState(searches);
  };

  const setSearchesState = (searches) => {
    setSavedSearches(searches);
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(searches));
    } catch (err) {
      console.error('Failed to save search to local storage:', err);
    }
  };

  const addSearch = useCallback(
    (name, query, filters) => {
      const newSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        timestamp: Date.now(),
      };
      setSearchesState([...savedSearches, newSearch]);
    },
    [savedSearches]
  );

  const deleteSearch = useCallback(
    (id) => {
      setSearchesState(savedSearches.filter((s) => s.id !== id));
    },
    [savedSearches]
  );

  const editSearch = useCallback(
    (id, newName) => {
      setSearchesState(savedSearches.map((s) => (s.id === id ? { ...s, name: newName } : s)));
    },
    [savedSearches]
  );

  return {
    savedSearches,
    addSearch,
    deleteSearch,
    editSearch,
  };
};

export default useSavedSearches;
