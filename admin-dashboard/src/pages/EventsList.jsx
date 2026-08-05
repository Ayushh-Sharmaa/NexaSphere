// pages/EventsList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationParams } from '../hooks/usePaginationParams';
import Pagination from '../components/Pagination';
import axiosInstance from '../api/axiosInstance';

const ITEMS_PER_PAGE = 10;

// Fix #865: Implement stale-while-revalidate caching to prevent re-fetch on every mount
// Pattern:
//   const [events, setEvents] = useState(() => getCachedEvents()); // show cache immediately
//   useEffect(() => {
//     fetchEvents().then(data => { setEvents(data); cacheEvents(data); });
//   }, []);
// This shows cached data instantly and refreshes in the background.
export default function EventsList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const { page, setPage, resetPage } = usePaginationParams();

  // Stale-while-revalidate cache: restore from sessionStorage on mount
  const cacheKey = `events_page_${page}_${search}`;

  useEffect(() => {
    let cancelled = false;

    // Show stale data from cache immediately
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { events: cachedEvents, total: cachedTotal } = JSON.parse(cached);
        if (!cancelled) {
          setEvents(cachedEvents || []);
          setTotalItems(cachedTotal || 0);
        }
      } catch {
        // ignore parse errors
      }
    }

    setLoading(true);

    axiosInstance
      .get(`/admin/events?page=${page}&limit=${ITEMS_PER_PAGE}&search=${search}`)
      .then(({ data }) => {
        if (!cancelled) {
          const eventsData = data.events || [];
          const totalData = data.total || 0;
          setEvents(eventsData);
          setTotalItems(totalData);
          // Cache fresh data for next visit
          sessionStorage.setItem(cacheKey, JSON.stringify({ events: eventsData, total: totalData }));
        }
      })
      .catch((err) => console.error('Failed to fetch events:', err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [page, search]);

  function handleSearch(e) {
    setSearch(e.target.value);
    resetPage();
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Events</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={handleSearch}
        style={{
          marginBottom: '16px',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          width: '300px',
          fontSize: '0.9rem',
        }}
      />

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => (
              <tr key={event.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                <td style={tdStyle}>{event.name}</td>
                <td style={tdStyle}>{event.date || '—'}</td>
                <td style={tdStyle}>{event.status || '—'}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => navigate(`/admin/events/${event.id}`)}
                    style={actionBtnStyle}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div style={{ marginTop: '20px' }}>
        <Pagination totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} />
      </div>
    </div>
  );
}

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#374151',
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: '0.9rem',
  color: '#4b5563',
};

const actionBtnStyle = {
  padding: '4px 12px',
  borderRadius: '4px',
  border: '1px solid #4f46e5',
  backgroundColor: 'transparent',
  color: '#4f46e5',
  cursor: 'pointer',
  fontSize: '0.85rem',
};