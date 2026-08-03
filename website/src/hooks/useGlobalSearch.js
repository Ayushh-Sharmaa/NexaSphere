import { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys.js';

// Simple debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Hook for managing advanced search state and API interaction
 */
export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  const activeRequestRef = useRef(null);
  const requestIdRef = useRef(0);

  // Safe lazy initializer protecting against malformed JSON crashes
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      return storedData ? JSON.parse(storedData) : [];
    } catch (err) {
      console.error(
        'Failed to parse malformed JSON payload from recent_searches storage stream:',
        err
      );
      return [];
    }
  });

  const updateRecentSearches = useCallback((q) => {
    if (!q || q.trim().length === 0) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== q);
      const updated = [q, ...filtered].slice(0, 5);

      try {
        localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to commit search telemetry update back to local disk storage:', err);
      }

      return updated;
    });
  }, []);

  const fetchResults = useCallback(
    async (searchQuery, filters) => {
      // Abort any in-flight request when a new one is triggered.
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }

      if (searchQuery.length < 2) {
        setResults([]);
        setSuggestions([]);
        setFacets({});
        setLoading(false);
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const controller = new AbortController();
      activeRequestRef.current = controller;

      setLoading(true);
      try {
        const filterParams = new URLSearchParams({
          q: searchQuery,
          ...filters,
        }).toString();

        const response = await fetch(`/api/search?${filterParams}`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }

        const nextResults = Array.isArray(data.results) ? data.results : [];
        setResults(nextResults);
        setFacets(data.facets || {});
        if (data.suggestions) setSuggestions([data.suggestions]);

        if (nextResults.length > 0) {
          updateRecentSearches(searchQuery);
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        console.error('Search API Error:', error);
      } finally {
        if (requestId === requestIdRef.current) {
          activeRequestRef.current = null;
          setLoading(false);
        }
      }
    },
    [updateRecentSearches]
  );

  // Debounce search triggers
  useEffect(() => {
    const t = setTimeout(() => {
      fetchResults(query, activeFilters);
    }, 300);

    return () => clearTimeout(t);
  }, [query, activeFilters, fetchResults]);

  useEffect(() => {
    return () => {
      if (activeRequestRef.current) activeRequestRef.current.abort();
    };
  }, []);

  const toggleFilter = (category, value) => {
    setActiveFilters((prev) => {
      const current = prev[category] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return { ...prev, [category]: next };
    });
  };

  const clearFilters = () => setActiveFilters({});

  const saveSearch = () => {
    let saved;
    try {
      const storedSaved = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
      saved = storedSaved ? JSON.parse(storedSaved) : [];
    } catch (err) {
      console.error('Failed to parse saved searches payload:', err);
      saved = [];
    }

    const newSave = { query, filters: activeFilters, timestamp: Date.now() };
    const updatedSaved = [...saved, newSave];

    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updatedSaved));
    } catch (err) {
      console.error('Failed to save search settings payload profile:', err);
    }
  };

  return {
    query,
    setQuery,
    results,
    loading,
    facets,
    activeFilters,
    toggleFilter,
    clearFilters,
    suggestions,
    recentSearches,
    saveSearch,
  };
};

export default useGlobalSearch;
