import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommandMenu({ isOpen, onClose, isHelpMode = false }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen]);

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
                <div style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>
                  Search functionality will be implemented in the Global Search feature.
                </div>
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
