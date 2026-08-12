import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getApiBase } from '../utils/runtimeConfig';

function matchesText(value, query) {
  return typeof value === 'string' && value.toLowerCase().includes(query);
}

export function getEventDisplayTitle(event) {
  return event?.title || event?.name || event?.shortName || '';
}

export function eventMatchesQuery(event, query) {
  return (
    matchesText(event?.title, query) ||
    matchesText(event?.name, query) ||
    matchesText(event?.shortName, query) ||
    matchesText(event?.description, query) ||
    matchesText(event?.category, query) ||
    matchesText(event?.location, query) ||
    event?.tags?.some?.((tag) => matchesText(tag, query))
  );
}

export function useEventSearch(activities, events) {
  const apiBase = getApiBase();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const abortRef = useRef(null);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('ns_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback((searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    const clean = searchTerm.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const next = [clean, ...filtered].slice(0, 10);
      localStorage.setItem('ns_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((searchTerm) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== searchTerm);
      localStorage.setItem('ns_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const searchApi = useCallback(
    async (q, type) => {
      if (!apiBase) return null;
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const params = new URLSearchParams({ q, type, limit: '50' });
        const res = await fetch(`${apiBase}/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error('Search failed');
        }
        return res.json();
      } catch (err) {
        if (err.name === 'AbortError') return null;
        throw err;
      }
    },
    [apiBase]
  );

  useEffect(() => {
    let active = true;

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setApiError(null);
      return;
    }

    const q = query.toLowerCase();
    setLoading(true);
    setApiError(null);

    const doSearch = async () => {
      try {
        const searchTerm = query.trim();
        const apiResults = await searchApi(searchTerm, filter === 'all' ? 'all' : filter);
        if (!active) return;
        if (apiResults && apiResults.results) {
          setResults(apiResults.results);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Search API error:', err);
        setApiError('Unable to connect to search service.');
      }

      if (!active) return;

      let all = [];

      if (filter === 'all' || filter === 'activities') {
        const actRes = Object.entries(activities || {})
          .filter(
            ([key, a]) =>
              matchesText(key, q) ||
              matchesText(a?.title, q) ||
              matchesText(a?.description, q) ||
              matchesText(a?.subtitle, q) ||
              matchesText(a?.tagline, q)
          )
          .map(([key, a]) => ({
            id: key,
            type: 'activity',
            title: a?.title || key,
            description: a?.description || a?.subtitle || a?.tagline || '',
            key,
          }));
        all = [...all, ...actRes];
      }

      if (filter === 'all' || filter === 'events') {
        const evRes = (events || [])
          .filter((ev) => eventMatchesQuery(ev, q))
          .map((ev) => {
            const title = getEventDisplayTitle(ev);
            return {
              id: ev.id || title,
              type: 'event',
              title,
              description: ev.description || ev.location || '',
              date: ev.date,
              tags: ev.tags,
              event: ev,
            };
          });
        all = [...all, ...evRes];
      }

      if (filter === 'all' || filter === 'members') {
        const base = getApiBase();
        try {
          const res = await fetch(`${base}/api/content/team`);
          if (!active) return;
          if (!res.ok) {
            setApiError(`Team member search unavailable (${res.status})`);
          } else {
            const data = await res.json();
            const members = data?.members || [];
            const matched = members
              .filter(
                (m) =>
                  matchesText(m.name, q) ||
                  matchesText(m.role, q) ||
                  matchesText(m.bio, q) ||
                  m.skills?.some((s) => matchesText(s, q))
              )
              .map((m) => ({
                id: m.id,
                type: 'member',
                title: m.name,
                description: m.role || m.bio || '',
                image: m.avatar || m.image,
              }));
            all = [...all, ...matched];
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('[useSearch] Team member fetch failed:', err.message);
            setApiError('Failed to search team members. Please try again.');
          }
        }
      }

      if (active) {
        setResults(all);
        setLoading(false);
      }
    };

    doSearch();

    return () => {
      active = false;
    };
  }, [query, filter, activities, events, searchApi]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setFilter('all');
    setResults([]);
    setApiError(null);
  }, []);

  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach((item) => {
      const type = item.type || 'other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
    });
    return groups;
  }, [results]);

  return {
    query,
    setQuery,
    filter,
    setFilter,
    results,
    groupedResults,
    loading,
    error: apiError,
    clearSearch,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
  };
}
