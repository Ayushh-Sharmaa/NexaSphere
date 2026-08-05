import React, { useState, useEffect } from 'react';
import { getApiBase } from '../../utils/apiClient';

const mockTeams = [];

export default function CollabPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('find-team');
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    const base = getApiBase();
    const teamsUrl = base ? `${base}/api/collab/teams` : null;
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
      showFeedback('Demo mode: Join requests are disabled.', 'error');
      return;
    }

    const base = getApiBase();
    const requestsUrl = base ? `${base}/api/collab/requests` : null;
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
      </div>

      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
      {feedback && (
        <div
          role="status"
          style={{
            maxWidth: '600px',
            margin: '0 auto 1.5rem auto',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor:
              feedback.type === 'error'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(16, 185, 129, 0.15)',
            color: feedback.type === 'error' ? '#f87171' : '#34d399',
            border: `1px solid ${
              feedback.type === 'error' ? '#ef4444' : '#10b981'
            }`,
            fontSize: '0.9rem',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {feedback.message}
        </div>
      )}
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
        {/* Card 1 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            padding: '2rem',
            transition: 'transform 0.2s',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>👥 Team Formation</h3>
          <p style={{ color: '#888', lineHeight: '1.6' }}>
            Find partners matching your skillset or search for projects looking for contributors.
          </p>
        </div>

        {/* Card 2 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            padding: '2rem',
            transition: 'transform 0.2s',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>⚡ Real-time Workspace</h3>
          <p style={{ color: '#888', lineHeight: '1.6' }}>
            Launch shared editor instances with CRDT-backed real-time document syncing.
          </p>
        </div>

        {/* Card 3 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            padding: '2rem',
            transition: 'transform 0.2s',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>🎨 Live Whiteboard</h3>
          <p style={{ color: '#888', lineHeight: '1.6' }}>
            Brainstorm visually with teams using our integrated, collaborative sketching canvases.
          </p>
        </div>
      </div>
    </div>
  );
}
