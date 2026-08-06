import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PermissionGuard } from './PermissionGuard';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

/* Public website URL */
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5175';
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AdminIcon } from "./AdminIcon";
import { adminPath } from "../utils/adminBasePath";

const links = [
  { to: '/dashboard', label: 'admin.dashboard', icon: 'Dashboard' },
  { to: '/dashboard/project-health', label: 'admin.projectHealth', icon: 'Shield' },
  { to: '/dashboard/analytics', label: 'admin.analytics', icon: 'BarChart' },
  { to: '/dashboard/analytics/funnel', label: 'admin.funnelAnalysis', icon: 'TrendingDown' },
  { to: '/dashboard/analytics/custom-events', label: 'admin.customEvents', icon: 'Target' },
  {
    to: '/dashboard/events',
    label: 'admin.events',
    icon: 'Calendar',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/waiting-room',
    label: 'admin.waitingRoom',
    icon: 'Clock',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/event-registrations',
    label: 'admin.registrations',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/event-scanner',
    label: 'admin.scanner',
    icon: 'Camera',
    requiredScope: 'events:write',
  },
  {
    to: '/dashboard/event-analytics',
    label: 'admin.eventAnalytics',
    icon: 'BarChart',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/reports/attendance',
    label: 'Attendance Report',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/activity-events',
    label: 'admin.activityEvents',
    icon: 'Target',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/core-team',
    label: 'admin.coreTeam',
    icon: 'Users',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/roles',
    label: 'admin.userRoles',
    icon: 'Shield',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/users',
    label: 'admin.users',
    icon: 'Users',
    requiredScope: 'settings:admin',
  },
  { to: '/dashboard/membership', label: 'admin.membership', icon: 'FileText' },
  { to: '/dashboard/sync-monitor', label: 'admin.syncMonitor', icon: 'Database' },
  { to: '/dashboard/recruitment', label: 'admin.recruitment', icon: 'UserPlus' },
  { to: '/dashboard/certificates', label: 'admin.certificates', icon: 'Award' },
  { to: '/dashboard/announcements', label: 'admin.announcements', icon: 'Megaphone' },
  {
    to: '/dashboard/banners',
    label: 'admin.banners',
    icon: 'Image',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/portfolios',
    label: 'admin.portfolios',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/forum',
    label: 'admin.forum',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/mentorship',
    label: 'admin.mentorship',
    icon: 'Users',
  },
  {
    to: '/dashboard/streams',
    label: 'admin.liveStreams',
    icon: 'Camera',
  },
  {
    to: '/dashboard/circuit-breaker',
    label: 'admin.circuitBreaker',
    icon: 'Activity',
  },
  {
    to: '/dashboard/qa-poll',
    label: 'admin.qaPolling',
    icon: 'MessageSquare',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/tasks',
    label: 'admin.scheduledTasks',
    icon: 'Clock',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/audit-logs',
    label: 'admin.auditLogs',
    icon: 'FileText',
    to: '/dashboard/audit-logs',
    label: 'Audit Logs',
    icon: 'FileText',
    to: '/dashboard/compliance',
    label: 'Compliance',
    icon: 'Shield',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/scheduled-tasks',
    label: 'admin.scheduledTasks',
    icon: 'Clock',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/backups',
    label: 'admin.backups',
    icon: 'Database',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/reports',
    label: 'admin.reports',
    icon: 'Target',
  },
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';
import { adminPath } from '../utils/adminBasePath';
import { PermissionGuard } from './PermissionGuard';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { to: '/dashboard/events', label: 'Events', icon: 'Calendar' },
  {
    to: '/dashboard/activity-events',
    label: 'Activity Events',
    icon: 'Target',
  },
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';
import { adminPath } from '../utils/adminBasePath';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { to: '/dashboard/events', label: 'Events', icon: 'Calendar' },
  {
    to: '/dashboard/activity-events',
    label: 'Activity Events',
    icon: 'Target',
  },
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminIcon } from './AdminIcon';
import { adminPath } from '../utils/adminBasePath';

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: 'Dashboard',
  },
  {
    to: '/dashboard/events',
    label: 'Events',
    icon: 'Calendar',
  },
  { to: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { to: '/dashboard/events', label: 'Events', icon: 'Calendar', requiredScope: 'events:read' },
  {
    to: '/dashboard/event-registrations',
    label: 'Registrations',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/event-scanner',
    label: 'Scanner',
    icon: 'Camera',
    requiredScope: 'events:write',
  },
  {
    to: '/dashboard/event-analytics',
    label: 'Analytics',
    icon: 'BarChart',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/activity-events',
    label: 'Activity Events',
    icon: 'Target',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/core-team',
    label: 'Core Team',
    icon: 'Users',
  {
    to: '/dashboard/settings',
    label: 'admin.platformSettings',
    icon: 'Settings',
    requiredScope: 'settings:admin',
  },
  {
    to: '/dashboard/core-team',
    label: 'Core Team',
    icon: 'Users',
  },
  {
    to: '/dashboard/membership',
    label: 'Membership',
    icon: 'FileText',
  },
  {
    to: '/dashboard/recruitment',
    label: 'Recruitment',
    icon: 'UserPlus',
  },
  {
    to: '/dashboard/certificates',
    label: 'Certificates',
    icon: 'Award',
  },
  {
    to: '/dashboard/announcements',
    label: 'Announcements',
    icon: 'Megaphone',
  },
  { to: '/dashboard/membership', label: 'Membership', icon: 'FileText' },
  { to: '/dashboard/certificates', label: 'Certificates', icon: 'Award' },
    to: '/dashboard/security',
    label: 'Security',
    icon: 'Globe',
    requiredScope: 'settings:admin',
    to: '/dashboard/reports',
    label: 'Reports',
    icon: 'Target',
  { to: '/dashboard/announcements', label: 'Announcements', icon: 'Megaphone' },
  {
    to: '/dashboard/portfolios',
    label: 'Portfolios',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/forum',
    label: 'Forum',
    icon: 'FileText',
    requiredScope: 'events:read',
  },
  {
    to: '/dashboard/mentorship',
    label: 'Mentorship',
    icon: 'Users',
  },
];

export function Sidebar() {
  const { email, logout } = useAuth();
  const { t } = useTranslation();

  const location = useLocation();

  const [open, setOpen] = useState(false);

  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);

    localStorage.setItem('ns-admin-theme', newTheme);

    setTheme(newTheme);
  };

  const sidebarRef = useRef(null);

  const hamburgerRef = useRef(null);

  const firstNavLinkRef = useRef(null);

  const close = () => {
    setOpen(false);

    // Restore focus to hamburger button
    hamburgerRef.current?.focus();
  };

  useEffect(() => {
    const handleOpenSidebar = () => setOpen(true);
    window.addEventListener('admin:open-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('admin:open-sidebar', handleOpenSidebar);
  }, []);

  // Focus first link when sidebar opens
  useEffect(() => {
    if (open) {
      firstNavLinkRef.current?.focus();
    }
  }, [open]);

  // ESC closes sidebar
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && open) {
        close();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Trap focus inside mobile sidebar
  useEffect(() => {
    if (!open || !sidebarRef.current) return;

    const focusableElements = sidebarRef.current.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];

    const lastElement = focusableElements[focusableElements.length - 1];

    function trapFocus(event) {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();

          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();

          firstElement.focus();
        }
      }
    }

    document.addEventListener('keydown', trapFocus);

    return () => {
      document.removeEventListener('keydown', trapFocus);
    };
  }, [open]);

  return (
    <>
      {/* Mobile Hamburger */}

      <button
        ref={hamburgerRef}
        className="sidebar-hamburger"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="admin-sidebar"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`ham-line${open ? ' open' : ''}`} />

        <span // a11y: aria-current indicates the active page to screen readers
              aria-current={isActive ? 'page' : undefined}
              className={`ham-line${open ? ' open' : ''}`} />
        <span className={`ham-line${open ? ' open' : ''}`} />

        <span className={`ham-line${open ? ' open' : ''}`} />
      </button>

      {/* Mobile Backdrop */}

      {open && <div className="sidebar-backdrop" onClick={close} aria-hidden="true" />}

      <aside
        id="admin-sidebar"
        ref={sidebarRef}
        className={`sidebar${open ? ' sidebar-open' : ''}`}
        role="navigation"
        aria-label="Admin Sidebar Navigation"
      >
        {/* Branding */}

        <div className="sidebar-brand">
          <span className="brand-dot" aria-hidden="true" />

          <span>NexaSphere Admin</span>
        </div>

        {/* Back To Website */}

        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-back-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted, #888)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--admin-border, rgba(255,255,255,0.06))',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--admin-accent, #CC1111)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--admin-text-muted, #888)')}
        >
          <AdminIcon name="ArrowLeft" size={12} aria-hidden="true" />
          {t('admin.backToWebsite')}
        </a>

        {/* Global Command Palette Trigger */}
        <div
          className="tour-command-palette"
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--admin-border, rgba(255,255,255,0.06))',
            marginBottom: '8px',
          }}
        >
          <button
            className="btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              opacity: 0.7,
            }}
            onClick={() => alert('Command Palette (Ctrl+K) triggered!')}
          >
            <span>Search</span>
            <kbd
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
              }}
            >
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation */}

        
      <div className="sidebar-search-container" style={{ padding: '0 16px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true
            });
            window.dispatchEvent(event);
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '8px 12px',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AdminIcon name="Search" size={16} />
            Search...
          </span>
          <kbd style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Cmd+K</kbd>
        </button>
      </div>

      <nav className="sidebar-nav">
          {links.map(({ to, label, icon, requiredScope, external }) => {
            const LinkElement = external ? (
              <a
                key={to}
                href={to}
                target="_blank"
                rel="noreferrer"
                className="nav-link"
                onClick={close}
              >
                <AdminIcon name={icon} size={16} aria-hidden="true" />
                {label}
                <AdminIcon
                  name="ExternalLink"
                  size={12}
                  style={{ marginLeft: 'auto', opacity: 0.5 }}
                />
              </a>
            ) : (
          {links.map(({ to, label, icon, requiredScope }) => {
            const LinkElement = (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                onClick={close}
                data-tour={label.toLowerCase()}
                onClick={close}
                data-tour={t(label).toLowerCase()}
              >
                <AdminIcon name={icon} size={16} aria-hidden="true" />
                {t(label)}
              </NavLink>
            );

            if (requiredScope) {
              return (
                <PermissionGuard key={to} requiredScope={requiredScope}>
                  {LinkElement}
                </PermissionGuard>
              );
            }
            return LinkElement;
          })}
        </nav>

        {/* Footer */}

        <div className="sidebar-footer">
          <div style={{ padding: '0 20px', marginBottom: '15px' }}>
            <LanguageSelector />
          </div>
          <span className="sidebar-email" aria-label={`Logged in as ${email}`}>
            {email}
          </span>
          <button
            className="btn-logout"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{ marginBottom: '10px' }}
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-dot" />
        <span>NexaSphere Admin</span>
      </div>
      
      <div className="sidebar-search-container" style={{ padding: '0 16px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true
            });
            window.dispatchEvent(event);
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '8px 12px',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AdminIcon name="Search" size={16} />
            Search...
          </span>
          <kbd style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Cmd+K</kbd>
        </button>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={adminPath(to)}
            end={to === '/dashboard'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {theme === 'dark' ? t('admin.switchToLightMode') : t('admin.switchToDarkMode')}
          </button>

          <button
            className="btn-logout"

            onClick={logout}
            aria-label={`Logout ${email}`}
            style={{ marginTop: '10px' }}
          >
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle sidebar"
      >
        <AdminIcon name="Menu" size={20} />
      </button>
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-dot" />
          <span>NexaSphere Admin</span>
        </div>
        <nav className="sidebar-nav" onClick={() => setOpen(false)}>
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={adminPath(to)}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <AdminIcon name={icon} size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-email">{email}</span>
          <button className="btn-logout" onClick={logout}>
        <div className="sidebar-footer">
          <span className="sidebar-email" aria-label={`Logged in as ${email}`}>
            {email}
          </span>

          <button className="btn-logout" onClick={logout} aria-label={`Logout ${email}`}>
            Logout
            {t('admin.logout')}
          </button>
        </div>
      </aside>
    </>
  );
  );
}

}
