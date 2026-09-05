import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { to: '/dashboard/events', label: 'Events', icon: 'Calendar' },
  { to: '/dashboard/activity-events', label: 'Activity Events', icon: 'Target' },
  { to: '/dashboard/core-team', label: 'Core Team', icon: 'Users' },
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
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <AdminIcon name={icon} size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-email">{email}</span>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
