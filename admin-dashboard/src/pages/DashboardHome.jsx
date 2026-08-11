import { CopyButton } from '../components/CopyButton';
import { DashboardCardSkeleton } from '../components/DashboardCardSkeleton';
import { useState, useEffect, useMemo } from 'react';
import { api, auth } from '../services/api';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';
import { PermissionGuard } from '../components/PermissionGuard';
export function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const navigate = useNavigate();
  const isOffline = auth.isOfflineMode();
  const scopes = auth.getScopes();

  const quickActions = useMemo(
    () =>
      QUICK_ACTIONS.filter(
        (action) => !action.requiredScope || scopes.includes(action.requiredScope)
      ),
    [scopes]
  );

  useEffect(() => {
    Promise.all([
      api.events.getAll().catch(() => ({ events: [] })),
      api.coreTeam.getAll().catch(() => ({ members: [] })),
      api.membership.getAll().catch(() => ({ responses: [] })),
    ]).then(([eventsData, teamData, membershipData]) => {
      const events = eventsData?.events ?? [];
      const team = teamData?.members || teamData?.data || (Array.isArray(teamData) ? teamData : []);
      const applications = membershipData?.responses ?? [];
      setStats({
        totalEvents: events.length,
        upcomingEvents: events.filter((e) => e.status === 'upcoming').length,
        teamMembers: team.length,
        totalApplications: applications.length,
      });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuickActionsOpen((open) => !open);
      }
      if (event.key === 'Escape') {
        setQuickActionsOpen(false);
      }
    }

    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>
          Dashboard
        </h2>
        <HelpTooltip
          content="Your overall administrator command center. Quick view of community events, application flows, and active staff."
          position="right"
        />
      </div>

      {/* ── Offline mode banner ── */}
      {isOffline && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '24px',
            fontSize: '0.82rem',
            color: 'rgba(234,179,8,0.9)',
          }}
        >
          <AdminIcon name="WifiOff" size={16} aria-hidden="true" />
          <span>
            <strong>Offline Mode</strong> — Changes are stored in browser localStorage only. Set{' '}
            <code>VITE_API_BASE</code> and <code>VITE_MEMBERSHIP_SCRIPT_URL</code> to connect live
            data sources.
          </span>
        </div>
      )}

      {loading ? (
        <div className="stats-grid tour-analytics-overview">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      ) : (
        <div className="stats-grid tour-analytics-overview">
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="Calendar" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.totalEvents}</div>
              <div className="stat-label">
                Total Events
                <HelpTooltip
                  content="The overall count of created, ongoing, and completed events."
                  position="top"
                />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="Clock" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.upcomingEvents}</div>
              <div className="stat-label">
                Upcoming Events
                <HelpTooltip content="Events scheduled to start in the future." position="top" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="Users" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.teamMembers}</div>
              <div className="stat-label">
                Core Team
                <HelpTooltip
                  content="Registered administrators, core team members, and role officers."
                  position="top"
                />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">
              <AdminIcon name="FileText" size={28} aria-hidden="true" />
            </span>
            <div>
              <div className="stat-value">{stats.totalApplications}</div>
              <div className="stat-label">
                Applications
                <HelpTooltip
                  content="Pending and reviewed applications for community membership."
                  position="top"
                />
                {isOffline && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '0.65rem',
                      opacity: 0.6,
                    }}
                  >
                    (offline)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="quick-links">
        <h3>Quick Actions</h3>
        <div className="quick-grid">
          <PermissionGuard requiredScope="events:read">
            <a
              href="/dashboard/events"
              className="quick-card tour-event-creation"
              aria-label="Manage events"
            >
              <AdminIcon name="Calendar" size={18} aria-hidden="true" /> Events
            </a>
          </PermissionGuard>
          <PermissionGuard requiredScope="events:read">
            <a
              href="/dashboard/activity-events"
              className="quick-card"
              aria-label="Manage activities"
            >
              <AdminIcon name="Target" size={18} aria-hidden="true" /> Activities
            </a>
          </PermissionGuard>
          <PermissionGuard requiredScope="settings:admin">
            <a href="/dashboard/core-team" className="quick-card" aria-label="Manage core team">
              <AdminIcon name="Users" size={18} aria-hidden="true" /> Team
            </a>
          </PermissionGuard>
          <a
            href="/dashboard/membership"
            className="quick-card"
            aria-label="View membership applications"
          >
            <AdminIcon name="FileText" size={18} aria-hidden="true" /> Membership
          </a>
        </div>
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <CopyButton text={window.location.origin + '/dashboard'} label="Copy Dashboard Link" />
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
        }}
      >
        {quickActionsOpen && (
          <div
            role="menu"
            aria-label="Quick actions"
            style={{
              width: '280px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 18px 36px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px 12px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <AdminIcon name="Wrench" size={18} aria-hidden="true" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>Quick Actions</div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.78rem' }}>
                    Ctrl/Cmd+K to toggle
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setQuickActionsOpen(false)}
                aria-label="Close quick actions"
                style={{ padding: '6px 10px', flexShrink: 0 }}
              >
                <AdminIcon name="X" size={16} aria-hidden="true" />
              </button>
            </div>

            <div style={{ padding: '10px' }}>
              {quickActions.map((action) => (
                <button
                  key={action.to}
                  type="button"
                  onClick={() => {
                    navigate(action.to);
                    setQuickActionsOpen(false);
                  }}
                  role="menuitem"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    border: '1px solid transparent',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface2)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <span
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.04)',
                      flexShrink: 0,
                    }}
                  >
                    <AdminIcon name={action.icon} size={18} aria-hidden="true" />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 600 }}>{action.label}</span>
                    <span
                      style={{
                        display: 'block',
                        color: 'var(--text2)',
                        fontSize: '0.78rem',
                        marginTop: '2px',
                      }}
                    >
                      {action.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setQuickActionsOpen((open) => !open)}
          aria-expanded={quickActionsOpen}
          aria-label="Toggle quick actions menu"
          title="Quick actions (Ctrl/Cmd+K)"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'var(--red)',
            color: '#fff',
            boxShadow: '0 18px 30px rgba(0, 0, 0, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <AdminIcon name={quickActionsOpen ? 'X' : 'Wrench'} size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
