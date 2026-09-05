const ICON_ALIASES = {
  Home: 'Dashboard',
  '\u{1F3E0}': 'Dashboard',
  '\u{1F4C5}': 'Calendar',
  '\u{1F51C}': 'Clock',
  '\u{1F465}': 'Users',
  '\u{1F3AF}': 'Target',
  '\u{1F9E0}': 'Brain',
  '\u{1F527}': 'Wrench',
  '\u{1F4CC}': 'Pin',
};

const ICONS = {
  Dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  LayoutDashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  Calendar: (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
    </>
  ),
  Clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  Users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
      <path d="M16 3.2a4 4 0 0 1 0 7.6" />
    </>
  ),
  Target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  Pencil: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </>
  ),
  Trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  X: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  Brain: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12v2h8v-2a7 7 0 0 0-4-12Z" />
    </>
  ),
  Wrench: (
    <>
      <path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2-2 2.4-2.4Z" />
    </>
  ),
  Pin: (
    <>
      <path d="M12 17v5" />
      <path d="M5 17h14" />
      <path d="M7 3h10l-1 8 3 6H5l3-6-1-8Z" />
    </>
  ),
  Check: (
    <>
      <path d="M20 6 9 17l-5-5" />
    </>
  ),
  ChevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  ChevronUp: (
    <>
      <path d="m18 15-6-6-6 6" />
    </>
  ),
  RefreshCw: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  Search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  UserPlus: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </>
  ),
  ClipboardList: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </>
  ),
  Ban: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </>
  ),
  RotateCcw: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  BookOpen: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  Mic: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </>
  ),
};

export function AdminIcon({ name, size = 18, className = '', ...props }) {
  const iconName = ICON_ALIASES[name] || name || 'Calendar';
  const paths = ICONS[iconName] || ICONS.Calendar;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {paths}
    </svg>
  );
}
