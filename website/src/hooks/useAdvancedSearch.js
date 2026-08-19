import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from '../utils/debounce.js';

/**
 * Hook for managing advanced search state and API interaction
 */
export const useAdvancedSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recent_searches') || '[]')
  );

  const fetchResults = useMemo(
    () =>
      debounce(async (searchQuery, filters) => {
        if (searchQuery.length < 2) {
          setResults([]);
          setSuggestions([]);
          return;
        }

        setLoading(true);
        try {
          // Build query string with facets
          const filterParams = new URLSearchParams({
            q: searchQuery,
            ...filters,
          }).toString();

          const response = await fetch(`/api/search?${filterParams}`);
          const data = await response.json();

          setResults(data.results);
          setFacets(data.facets);
          if (data.suggestions) setSuggestions([data.suggestions]);

          // Update recent searches if results found
          if (data.results.length > 0) {
            updateRecentSearches(searchQuery);
          }
        } catch (error) {
          console.error('Search API Error:', error);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    fetchResults(query, activeFilters);
    return () => fetchResults.cancel();
  }, [query, activeFilters, fetchResults]);

  const updateRecentSearches = (q) => {
    const updated = [q, ...recentSearches.filter((item) => item !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

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
      saved = JSON.parse(localStorage.getItem('saved_searches') || '[]');
      if (!Array.isArray(saved)) saved = [];
    } catch {
      // Malformed saved_searches in storage — start fresh instead of crashing
      saved = [];
    }
    const newSave = { query, filters: activeFilters, timestamp: Date.now() };
    try {
      localStorage.setItem('saved_searches', JSON.stringify([...saved, newSave]));
    } catch {
      // Ignore QuotaExceededError / SecurityError — save action degrades silently
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
