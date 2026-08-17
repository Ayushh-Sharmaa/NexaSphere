import { useState, useEffect, useRef } from 'react';
import { ChevronUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const DOCK_ACTIONS = [
  {
    id: 'explore',
    label: 'Explore',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
    path: '/explore',
  },
  {
    id: 'back-to-top',
    label: 'Back to top',
    icon: <ChevronUp size={18} />,
    action: 'scroll-top',
  },
  {
    id: 'github',
    label: 'GitHub Repository',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4" />
      </svg>
    ),
    href: 'https://github.com/Ayushh-Sharmaa/NexaSphere',
  },
  {
    id: 'admin',
    label: 'Admin Dashboard',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
    action: 'navigate-admin',
  },
];

export default function FloatingDock() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const toggleRef = useRef(null);
  const [mobile, setMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Close dock on Escape and return focus to toggle button
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleAction = (item) => {
    if (item.action === 'scroll-top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.action === 'navigate-admin') {
      navigate('/admin');
    } else if (item.href && isSafeUrl(item.href)) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    }
    setOpen(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: mobile ? '90px' : '110px',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
      }}
    >
      {/* Action buttons (shown when open) */}
      {open && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'popIn 0.25s cubic-bezier(.22,1,.36,1) forwards',
            // Ensure dock items are focusable when open
            tabIndex: open ? 0 : -1,
          }}
        >
          {DOCK_ACTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleAction(item)}
              title={item.label}
              aria-label={item.label} // Explicit label for screen readers
              role="menuitem" // Indicate this is an item in a menu
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(10,10,10,0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.12)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(204,17,17,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}

      {/* Main toggle button */}
      <button
        ref={toggleRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close dock' : 'Open dock'}
        aria-expanded={open}
        aria-haspopup="true" // Indicate that this button opens a popup
        role="button" // Explicitly define role as button
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: open ? '#CC1111' : 'linear-gradient(135deg, #CC1111, #880000)',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(204,17,17,0.55)',
          transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), background 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
        }}
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
