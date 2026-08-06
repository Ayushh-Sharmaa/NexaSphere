import React, { useState, useEffect } from 'react';
import TeamChat from './TeamChat';

export default function CollabPage({ onBack, user }) {
  const [activeTab, setActiveTab] = useState('find-team'); // 'find-team', 'skill-swap'
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teamsUrl = buildUrl(getApiBase(), '/api/collab/teams');
    if (!teamsUrl) {
      setTeams(mockTeams);
      setIsDemo(true);
      setLoading(false);
      return;
    }
    fetch(teamsUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTeams(Array.isArray(data) && data.length ? data : mockTeams);
        setIsDemo(!Array.isArray(data) || data.length === 0);
      })
      .catch(() => {
        setTeams(mockTeams);
        setIsDemo(true);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (activeTab !== 'find-team') {
      setSearch('');
    }
  }, [activeTab]);
  const handleJoinSubmit = async (requestData) => {
    if (isDemo) {
      alert('Demo mode: Join requests are disabled.');
      return;
    }

    const requestsUrl = buildUrl(getApiBase(), '/api/collab/requests');
    if (!requestsUrl) return;

    await fetch(requestsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.vacantRoles.some((r) => r.toLowerCase().includes(search.toLowerCase())) ||
      t.techStack.some((ts) => ts.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      style={{
        padding: '3rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        color: 'var(--text)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted, #999)',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '0.8rem',
            background: 'linear-gradient(135deg, #fff, #999)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Collaboration Space
        </h1>
        <p style={{ color: 'var(--text-muted, #888)', fontSize: '1.1rem' }}>
          Form teams, connect on projects, and build amazing solutions together.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '2rem',
        }}
      >
        <div style={{ gridColumn: '1 / -1' }}>
          <TeamChat teamId="global-collab" user={user || { id: 'test-user', name: 'Developer' }} />
        </div>
      </div>
    </div>
  );
}
