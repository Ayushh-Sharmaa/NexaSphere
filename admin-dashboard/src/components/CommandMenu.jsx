import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommandMenu({ isOpen, onClose, isHelpMode = false }) {
const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/admin/search?q=, {
          credentials: 'include'
        });
        const data = await res.json();
        setResults(data.data?.results || data.results || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: 'Cmd/Ctrl + K', action: 'Global Search' },
    { keys: 'Cmd/Ctrl + Shift + A', action: 'Create Announcement' },
    { keys: 'Cmd/Ctrl + Shift + E', action: 'Create Event' },
    { keys: '?', action: 'Show all shortcuts' },
  ];

  const handleOverlayClick = (e) => {
    if (e.target.className === 'command-menu-overlay') {
      onClose();
    }
  };

  return (
    <div
      className="command-menu-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '10vh',
      }}
    >
      
      <style>
        {
          .search-result-item:hover {
            background: rgba(255,255,255,0.1) !important;
          }
        }
      </style>
      <div
        style={{
          background: '#1a1a2e',
          width: '100%',
          maxWidth: '600px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          color: '#fff',
          border: '1px solid #2d2d44',
        }}
      >
        {isHelpMode ? (
          <div style={{ padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Keyboard Shortcuts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shortcuts.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                  <span style={{ color: '#aaa' }}>{s.action}</span>
                  <kbd style={{ background: '#333', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '10px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div style={{ padding: '16px', borderBottom: '1px solid #2d2d44' }}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users, events, announcements..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '18px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {search.length > 0 ? (
                loading ? (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>Searching...</div>
                ) : results.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (r.type === 'user') navigate(/dashboard/users/);
                          if (r.type === 'event') navigate(/dashboard/events/);
                          if (r.type === 'post') navigate(/dashboard/announcements/);
                          onClose();
                        }}
                        style={{
                          padding: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        className="search-result-item"
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{r.title}</div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>{r.subtitle}</div>
                        </div>
                        <div style={{ fontSize: '10px', padding: '2px 6px', background: '#333', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {r.type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>No results found</div>
                )
              ) : (
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Type to start searching...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
