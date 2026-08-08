import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, Calendar, Tag, ChevronDown } from 'lucide-react';

export default function AdvancedFilters({ events, onFilterChange }) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    category: 'all',
    status: 'all',
    search: '',
  });

  const categories = useMemo(() => {
    const cats = new Set();
    (events || []).forEach((ev) => {
      if (ev.category) cats.add(ev.category);
      if (ev.tags) ev.tags.forEach((t) => cats.add(t.toLowerCase()));
    });
    return ['all', ...Array.from(cats).sort((a, b) => a - b)];
  }, [events]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilterChange?.(next);
  };

  const clearFilters = () => {
    const reset = { dateRange: 'all', category: 'all', status: 'all', search: '' };
    setFilters(reset);
    onFilterChange?.(reset);
  };

  const hasActive = Object.values(filters).some((v) => v !== 'all' && v !== '');

  return (
    <div style={{ marginBottom: '24px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: hasActive ? 'rgba(204,17,17,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${hasActive ? 'var(--c1)' : 'var(--bdr)'}`,
          borderRadius: '10px',
          padding: '8px 16px',
          color: hasActive ? 'var(--c1)' : 'var(--t2)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.85rem',
          transition: 'all 0.2s',
        }}
      >
        <Filter size={15} />
        Filters
        {hasActive && (
          <span
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c1)' }}
          />
        )}
        <ChevronDown
          size={14}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {hasActive && (
        <button
          onClick={clearFilters}
          style={{
            marginLeft: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--t2)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Clear all
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: '12px',
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid var(--bdr)',
              }}
            >
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--t3)',
                    display: 'block',
                    marginBottom: '6px',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{' '}
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--bdr)',
                    color: 'var(--t1)',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="past">Past Events</option>
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '160px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--t3)',
                    display: 'block',
                    marginBottom: '6px',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  <Tag size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Category
                  / Tag
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--bdr)',
                    color: 'var(--t1)',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '120px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--t3)',
                    display: 'block',
                    marginBottom: '6px',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--bdr)',
                    color: 'var(--t1)',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '160px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--t3)',
                    display: 'block',
                    marginBottom: '6px',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  <Search size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{' '}
                  Keyword
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Keyword…"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--bdr)',
                    color: 'var(--t1)',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
