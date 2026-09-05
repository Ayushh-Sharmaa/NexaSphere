import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/dashboard/events', label: 'Events', icon: 'Calendar' },
  { to: '/dashboard/activity-events', label: 'Activity Events', icon: 'Target' },
  { to: '/dashboard/core-team', label: 'Core Team', icon: 'Users' },
  { divider: true, label: 'Applications' },
  { to: '/dashboard/membership-apps', label: 'Membership Apps', icon: 'UserPlus' },
  { to: '/dashboard/coreteam-apps', label: 'Core Team Apps', icon: 'ClipboardList' },
];

export function Sidebar() {
  const { email, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-dot" />
        <span>NexaSphere Admin</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link, i) => {
          if (link.divider) {
            return (
              <div key={`divider-${i}`} style={{
                padding: '12px 12px 4px',
                fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
                textTransform: 'uppercase', color: 'var(--text2)',
                opacity: 0.6,
              }}>
                {link.label}
              </div>
            );
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <AdminIcon name={link.icon} size={16} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-email">{email}</span>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
