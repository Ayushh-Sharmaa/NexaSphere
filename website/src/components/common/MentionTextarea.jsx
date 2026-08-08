import React, { useState, useRef, useEffect } from 'react';
import { getApiBase } from '../../utils/runtimeConfig';

/**
 * A textarea wrapper that provides @mention autocomplete functionality.
 */
export function MentionTextarea({ value, onChange, placeholder, className, rows = 3, style = {} }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);

  // Debounce user search
  useEffect(() => {
    if (!showDropdown) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/api/users?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setUsers(data?.users || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [query, showDropdown]);

  const updatePosition = (element) => {
    // Basic positioning hack (ideally use getCaretCoordinates)
    // We position it at the bottom-left of the textarea
    setDropdownPos({
      top: element.offsetHeight,
      left: 0,
    });
  };

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (match) {
      setShowDropdown(true);
      setQuery(match[1]);
      setCursorPos(cursor - match[0].length);
      updatePosition(e.target);
    } else {
      setShowDropdown(false);
    }
  };

  const insertMention = (username) => {
    const val = textareaRef.current.value;
    const textBeforeMention = val.slice(0, cursorPos);
    const textAfterCursor = val.slice(textareaRef.current.selectionStart);

    const newValue = `${textBeforeMention}@${username} ${textAfterCursor}`;
    onChange(newValue);
    setShowDropdown(false);

    // Focus back on textarea after a small delay
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPos + username.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < users.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (users[selectedIndex]) {
          insertMention(users[selectedIndex].username);
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
        style={{ width: '100%', resize: 'vertical', ...style }}
      />

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: `${dropdownPos.top + 4}px`,
            left: `${dropdownPos.left}px`,
            background: 'var(--card, #1e1e1e)',
            border: '1px solid var(--bdr, #333)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '200px',
            padding: '4px 0',
          }}
        >
          {loading ? (
            <div style={{ padding: '8px 12px', color: 'var(--t3)' }}>Searching...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: '8px 12px', color: 'var(--t3)' }}>No users found</div>
          ) : (
            users.map((user, idx) => (
              <div
                key={user.id}
                onClick={() => insertMention(user.username)}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  background: idx === selectedIndex ? 'var(--hover, #2a2a2a)' : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <img
                  src={
                    user.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                  }
                  alt={user.username}
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--t1)' }}>
                    {user.display_name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>@{user.username}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
