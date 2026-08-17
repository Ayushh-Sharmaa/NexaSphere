import DOMPurify from 'dompurify';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ArrowRight,
  Calendar,
  Zap,
  Users,
  BookOpen,
  User,
  Folder,
  MessageSquare,
} from 'lucide-react';
// TODO: useSearch hook not implemented yet
// import { useSearch } from '../hooks/useSearch';

function Highlight({ text, query }) {
  if (!text) return null;

  // If the text contains Typesense highlight <mark> tags, sanitize before rendering as HTML.
  // Only <mark> is allowed through — everything else (scripts, event handlers, other tags) is stripped.
  if (String(text).includes('<mark>')) {
    const clean = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: ['mark'],
      ALLOWED_ATTR: [],
      USE_PROFILES: { html: true },
    });
    return <span dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  if (!query) return <>{text}</>;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${safe})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : part
      )}
    </>
  );
}

const TYPE_CONFIG = {
  activity: {
    bg: 'rgba(204,17,17,0.15)',
    color: 'var(--c1)',
    icon: <Zap size={16} color="var(--c1)" />,
    label: 'Activity',
  },
  event: {
    bg: 'rgba(90,90,255,0.15)',
    color: '#9999ff',
    icon: <Calendar size={16} color="#9999ff" />,
    label: 'Event',
  },
  member: {
    bg: 'rgba(0,200,100,0.15)',
    color: '#00c864',
    icon: <Users size={16} color="#00c864" />,
    label: 'Member',
  },
  user: {
    bg: 'rgba(0,200,255,0.15)',
    color: '#00c8ff',
    icon: <User size={16} color="#00c8ff" />,
    label: 'User',
  },
  portfolio: {
    bg: 'rgba(255,100,255,0.15)',
    color: '#ff64ff',
    icon: <User size={16} color="#ff64ff" />,
    label: 'Portfolio',
  },
  community: {
    bg: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    icon: <Folder size={16} color="#f59e0b" />,
    label: 'Community',
  },
  post: {
    bg: 'rgba(167,139,250,0.15)',
    color: '#a78bfa',
    icon: <MessageSquare size={16} color="#a78bfa" />,
    label: 'Discussion',
  },
  resource: {
    bg: 'rgba(34,197,94,0.15)',
    color: '#22c55e',
    icon: <BookOpen size={16} color="#22c55e" />,
    label: 'Resource',
  },
};

const CATEGORIES_ORDER = [
  'event',
  'activity',
  'member',
  'user',
  'portfolio',
  'community',
  'post',
  'resource',
];

const GROUP_TITLES = {
  event: 'Events',
  activity: 'Activities',
  member: 'Core Team',
  user: 'Registered Users',
  portfolio: 'User Portfolios',
  community: 'Communities & Groups',
  post: 'Discussion Posts',
  resource: 'Learning Resources',
};

export default function SearchBar({ open, onClose, activities, events, onNavigate, onEventClick }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [focusIdx, setFocusIdx] = useState(-1);
  const {
    query,
    setQuery,
    filter,
    setFilter,
    results,
    groupedResults,
    loading,
    error,
    clearSearch,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
  } = useSearch(activities, events);

  const [localQuery, setLocalQuery] = useState('');
  const timeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setQuery(val);
    }, 350);
  };

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      clearSearch();
      return () => clearTimeout(t);
    }
    setFocusIdx(-1);
  }, [open, clearSearch]);

  useEffect(() => {
    setFocusIdx(-1);
  }, [results]);

  const handleClick = useCallback(
    (result) => {
      addRecentSearch(result.title || query);
      if (result.type === 'activity') onNavigate('activity', result.key || result.id);
      else if (result.type === 'event')
        onEventClick(result.event || { id: result.id, name: result.title });
      else if (result.type === 'member') navigate(result.url || '/team');
      onClose();
      clearSearch();
    },
    [onNavigate, onEventClick, onClose, clearSearch, navigate, addRecentSearch, query]
  );

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose();
      if (!results.length) {
        if (e.key === 'Enter' && query.trim()) {
          e.preventDefault();
          addRecentSearch(query);
          navigate(
            `/search?q=${encodeURIComponent(query)}${filter !== 'all' ? `&type=${filter}` : ''}`
          );
          onClose();
          clearSearch();
        }
        return;
      }
      if (!results.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (focusIdx >= 0 && focusIdx < results.length) {
          handleClick(results[focusIdx]);
        } else if (query.trim()) {
          addRecentSearch(query);
          navigate(
            `/search?q=${encodeURIComponent(query)}${filter !== 'all' ? `&type=${filter}` : ''}`
          );
          onClose();
          clearSearch();
        }
      }
    };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [
    open,
    results,
    focusIdx,
    query,
    filter,
    handleClick,
    navigate,
    addRecentSearch,
    clearSearch,
    onClose,
  ]);

  useEffect(() => {
    if (focusIdx >= 0 && listRef.current) {
      const activeElement = listRef.current.querySelector('[aria-selected="true"]');
      if (activeElement) {
        activeElement.scrollIntoView?.({ block: 'nearest' });
      }
    }
  }, [focusIdx]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '72px 16px 32px',
            overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ y: -28, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%',
              maxWidth: '680px',
              background: 'var(--bg)',
              border: '1px solid rgba(204,17,17,0.22)',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(204,17,17,0.08)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Search size={20} color="var(--c1)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={localQuery}
                onChange={handleInputChange}
                placeholder="Search events, members, activities…"
                aria-label="Search"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--t1)',
                  fontSize: '1.05rem',
                  fontFamily: 'inherit',
                }}
              />
              {query && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--t2)',
                    display: 'flex',
                    padding: '4px',
                  }}
                >
                  <X size={17} />
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--t2)',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontSize: '0.74rem',
                  fontFamily: 'inherit',
                  letterSpacing: '0.05em',
                }}
              >
                ESC
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexWrap: 'wrap',
              }}
            >
              {[
                { key: 'all', label: 'All' },
                { key: 'events', label: 'Events' },
                { key: 'posts', label: 'Discussions' },
                { key: 'resources', label: 'Resources' },
                { key: 'members', label: 'Core Team' },
                { key: 'users', label: 'Users' },
                { key: 'activities', label: 'Activities' },
                { key: 'activities', label: 'Activities' },
                { key: 'members', label: 'Members' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setFilter(f.key);
                    setFocusIdx(-1);
                  }}
                  style={{
                    background: filter === f.key ? 'var(--c1)' : 'rgba(255,255,255,0.07)',
                    color: filter === f.key ? '#fff' : 'var(--t2)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '5px 15px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.18s, color 0.18s',
                  }}
                >
                  {f.label}
                </button>
              ))}
              {query && (
                <span style={{ marginLeft: 'auto', color: 'var(--t2)', fontSize: '0.78rem' }}>
                  {loading
                    ? 'Searching…'
                    : `${results.length} result${results.length !== 1 ? 's' : ''}`}
                </span>
              )}
            </div>

            <div ref={listRef} style={{ maxHeight: '420px', overflowY: 'auto' }} role="listbox">
              {error && (
                <div
                  style={{
                    padding: '20px',
                    color: '#CC1111',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              {!query && recentSearches.length > 0 && (
                <div style={{ padding: '16px 20px' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--t2)',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Recent Searches</span>
                    <button
                      onClick={() => {
                        localStorage.removeItem('ns_recent_searches');
                        window.location.reload();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--c1)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {recentSearches.map((s) => (
                      <span
                        key={s}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '5px 12px',
                          borderRadius: '16px',
                          fontSize: '0.8rem',
                          color: 'var(--t1)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => {
                          setQuery(s);
                          inputRef.current?.focus();
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                        }
                      >
                        <span>{s}</span>
                        <X
                          size={13}
                          style={{ cursor: 'pointer', color: 'var(--t3)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(s);
                          }}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!query && recentSearches.length === 0 && (
                <div style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--t2)' }}>
                  <Search size={34} color="rgba(204,17,17,0.35)" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
                    Type to search events, members &amp; activities
                  </div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.6 }}>
                    Press{' '}
                    <kbd
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Ctrl+K
                    </kbd>{' '}
                    anytime — ↑↓ to navigate, Enter to select
                  </div>
                </div>
              )}

              {loading && query && (
                <div
                  style={{
                    padding: '24px 20px',
                    textAlign: 'center',
                    color: 'var(--t2)',
                    fontSize: '0.9rem',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '2px solid rgba(204,17,17,0.2)',
                      borderTop: '2px solid #CC1111',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 12px',
                    }}
                  />
                  Searching platform… Searching across events, members, and activities…
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div style={{ padding: '44px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>🔍</div>
                  <div
                    style={{
                      color: 'var(--t1)',
                      fontWeight: 600,
                      fontSize: '1rem',
                      marginBottom: '6px',
                    }}
                  >
                    No results for &ldquo;{query}&rdquo;
                  </div>
                  <div style={{ color: 'var(--t2)', fontSize: '0.88rem' }}>
                    Try different keywords or change the filter
                  </div>
                </div>
              )}

              {!loading && query && results.length > 0 && (
                <div style={{ paddingBottom: '8px' }}>
                  {CATEGORIES_ORDER.map((type) => {
                    const items = groupedResults[type];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={type} style={{ marginTop: '8px' }}>
                        <div
                          style={{
                            padding: '8px 20px 4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--c1)',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {TYPE_CONFIG[type]?.icon}
                          {GROUP_TITLES[type]}
                        </div>
                        {items.map((result) => {
                          const idx = results.indexOf(result);
                          const tc = TYPE_CONFIG[result.type] || TYPE_CONFIG.event;
                          return (
                            <button
                              key={`${result.id}-${result.type}`}
                              onClick={() => handleClick(result)}
                              role="option"
                              aria-selected={focusIdx === idx}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                background: focusIdx === idx ? 'rgba(204,17,17,0.12)' : 'none',
                                border: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                padding: '14px 20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                transition: 'background 0.15s',
                                color: 'var(--t1)',
                              }}
                              onMouseEnter={() => setFocusIdx(idx)}
                              onMouseLeave={() => setFocusIdx(-1)}
                            >
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '11px',
                                  flexShrink: 0,
                                  background: tc.bg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {tc.icon}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    marginBottom: '3px',
                                  }}
                                >
                                  <Highlight text={result.title} query={query} />
                                </div>
                                {result.description && (
                                  <div
                                    style={{
                                      color: 'var(--t2)',
                                      fontSize: '0.82rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <Highlight
                                      text={result.description.slice(0, 90)}
                                      query={query}
                                    />
                                    {result.description.length > 90 && '…'}
                                  </div>
                                )}
                                <span
                                  style={{
                                    display: 'inline-block',
                                    marginTop: '5px',
                                    fontSize: '0.7rem',
                                    padding: '1px 9px',
                                    borderRadius: '10px',
                                    background: tc.bg,
                                    color: tc.color,
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {tc.label}
                                </span>
                              </div>
                              <ArrowRight size={15} color="var(--t2)" style={{ flexShrink: 0 }} />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {query && results.length > 0 && (
                <div
                  style={{
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--t3)' }}>
                    Press Enter to view all results
                  </span>
                  <button
                    onClick={() => {
                      addRecentSearch(query);
                      navigate(
                        `/search?q=${encodeURIComponent(query)}${filter !== 'all' ? `&type=${filter}` : ''}`
                      );
                      onClose();
                      clearSearch();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--c1)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    View all results <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
