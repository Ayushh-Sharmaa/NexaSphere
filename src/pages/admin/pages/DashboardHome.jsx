import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';

export function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.events.getAll().catch(() => ({ events: [] })),
      api.coreTeam.getAll().catch(() => ({ members: [] })),
      api.membershipApps.getAll().catch(() => ({ apps: [] })),
      api.coreTeamApps.getAll().catch(() => ({ apps: [] })),
    ]).then(([eventsData, teamData, memberApps, coreApps]) => {
      const events = eventsData?.events || eventsData || [];
      const team = teamData?.members || teamData || [];
      const mApps = memberApps?.apps || [];
      const cApps = coreApps?.apps || [];
      setStats({
        totalEvents: events.length,
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        teamMembers: team.length,
        memberPending: mApps.filter(a => a.status === 'pending').length,
        memberTotal: mApps.length,
        coreTeamPending: cApps.filter(a => a.status === 'pending').length,
        coreTeamTotal: cApps.length,
      });
      setLoading(false);
    });
  }, []);

  const statCard = (icon, value, label, sub, color) => (
    <div className="stat-card">
      <span className="stat-icon" style={color ? { color } : {}}>
        <AdminIcon name={icon} size={28} />
      </span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      {loading ? (
        <div className="stats-grid">
          <Skeleton height={100} count={5} />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {statCard('Calendar', stats.totalEvents, 'Total Events', `${stats.upcomingEvents} upcoming`)}
            {statCard('Users', stats.teamMembers, 'Core Team Members')}
            {statCard('UserPlus', stats.memberTotal, 'Membership Apps', `${stats.memberPending} pending review`, stats.memberPending > 0 ? '#ffb400' : undefined)}
            {statCard('ClipboardList', stats.coreTeamTotal, 'Core Team Apps', `${stats.coreTeamPending} pending review`, stats.coreTeamPending > 0 ? '#ffb400' : undefined)}
          </div>
        </>
      )}
      <div className="quick-links">
        <h3>Quick Actions</h3>
        <div className="quick-grid">
          <Link to="/admin/events" className="quick-card"><AdminIcon name="Calendar" size={18} /> Manage Events</Link>
          <Link to="/admin/activity-events" className="quick-card"><AdminIcon name="Target" size={18} /> Activity Events</Link>
          <Link to="/admin/core-team" className="quick-card"><AdminIcon name="Users" size={18} /> Core Team</Link>
          <Link to="/admin/membership-apps" className="quick-card"><AdminIcon name="UserPlus" size={18} /> Membership Apps</Link>
          <Link to="/admin/coreteam-apps" className="quick-card"><AdminIcon name="ClipboardList" size={18} /> Core Team Apps</Link>
        </div>
      </div>
    </div>
  );
}
