import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminIcon } from '../components/AdminIcon';
import { Skeleton } from '../components/Skeleton';

export function PortfolioManager() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    tier: 'bronze',
  });
  const [achievementError, setAchievementError] = useState('');
  const [awarding, setAwarding] = useState(false);

  const fetchPortfolios = async (query) => {
    setLoading(true);
    setError('');
    try {
      const params = query ? `?username=${encodeURIComponent(query)}` : '';
      const data = await api.portfolios.getAll(params);
      setPortfolios(data?.portfolios || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPortfolios(searchQuery);
  };

  const selectPortfolio = async (portfolio) => {
    setSelectedPortfolio(portfolio);
    try {
      const username = portfolio.username || portfolio.title?.toLowerCase();
      if (username) {
        const data = await api.portfolios.getAchievements(username);
        setAchievements(data?.achievements || []);
      }
    } catch {
      setAchievements([]);
    }
  };

  const handleAward = async (e) => {
    e.preventDefault();
    if (!newAchievement.name || !selectedPortfolio?.username) return;
    setAchievementError('');
    setAwarding(true);
    try {
      const result = await api.portfolios.awardAchievement(
        selectedPortfolio.username,
        newAchievement
      );
      setAchievements((prev) => [result.achievement, ...prev]);
      setNewAchievement({ name: '', description: '', tier: 'bronze' });
    } catch (e) {
      setAchievementError(e.message);
    } finally {
      setAwarding(false);
    }
  };

  const handleRemoveAchievement = async (name) => {
    if (!selectedPortfolio?.username) return;
    try {
      await api.portfolios.removeAchievement(selectedPortfolio.username, name);
      setAchievements((prev) => prev.filter((a) => a.name !== name));
    } catch (e) {
      setAchievementError(e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to move this portfolio to trash?')) return;
    try {
      const res = await fetch(`/api/admin/portfolios/${selectedPortfolio.username}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        alert('Moved to trash');
        fetchPortfolios();
        setSelectedPortfolio(null);
      } else alert('Failed to delete');
    } catch (e) {
      alert('Error');
    }
  };

  const handleRecover = async () => {
    try {
      const res = await fetch(`/api/admin/portfolios/${selectedPortfolio.username}/recover`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        alert('Recovered');
        fetchPortfolios();
      } else alert('Failed to recover');
    } catch (e) {
      alert('Error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Student Portfolios</h2>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by username…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 320,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-border, #333)',
            background: 'var(--admin-bg-card, #1a1a2e)',
            color: 'var(--admin-text, #eee)',
          }}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        {searchQuery && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              fetchPortfolios();
            }}
          >
            Clear
          </button>
        )}
      </form>

      {loading && <Skeleton height={48} count={4} />}
      {error && <div className="page-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          {!loading && !error && portfolios.length === 0 && (
            <div className="empty-state">No portfolios found.</div>
          )}
          {portfolios.length > 0 && (
            <div className="list">
              {portfolios.map((p) => (
                <div
                  key={p.username}
                  className={`list-item ${selectedPortfolio?.username === p.username ? 'active' : ''}`}
                  onClick={() => selectPortfolio(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="list-item-left">
                    <div>
                      <div className="item-name">{p.username}</div>
                      <div className="item-meta">
                        {p.title || 'No title'} · {p.skills?.length || 0} skills
                      </div>
                    </div>
                  </div>
                  <div className="list-item-right">
                    <AdminIcon name="ChevronRight" size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {selectedPortfolio ? (
            <div
              style={{
                background: 'var(--admin-bg-card, #1a1a2e)',
                border: '1px solid var(--admin-border, #333)',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontFamily: 'Rajdhani,sans-serif' }}>
                {selectedPortfolio.username}
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 20,
                  fontSize: '0.85rem',
                  color: 'var(--admin-text-muted, #888)',
                }}
              >
                <div>
                  <strong>Title:</strong> {selectedPortfolio.title || '—'}
                </div>
                <div>
                  <strong>Bio:</strong>{' '}
                  {selectedPortfolio.bio ? selectedPortfolio.bio.slice(0, 120) + '…' : '—'}
                </div>
                <div>
                  <strong>Skills:</strong>{' '}
                  {selectedPortfolio.skills?.map((s) => s.name).join(', ') || '—'}
                </div>
                <div>
                  <strong>Projects:</strong> {selectedPortfolio.projects?.length || 0}
                </div>
                <div>
                  <strong>Theme:</strong> {selectedPortfolio.theme}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleDelete}
                    style={{
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 4,
                    }}
                  >
                    Move to Trash
                  </button>
                  <button
                    onClick={handleRecover}
                    style={{
                      background: '#388e3c',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 4,
                    }}
                  >
                    Recover from Trash
                  </button>
                </div>
              </div>

              <h4
                style={{
                  margin: '0 0 12px',
                  fontFamily: 'Rajdhani,sans-serif',
                  fontSize: '0.9rem',
                }}
              >
                <AdminIcon name="Award" size={14} style={{ marginRight: 6 }} />
                Achievements
              </h4>

              {achievements.length === 0 && (
                <div
                  style={{
                    color: 'var(--admin-text-muted, #888)',
                    fontSize: '0.85rem',
                    marginBottom: 12,
                  }}
                >
                  No achievements yet.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {achievements.map((a) => (
                  <div
                    key={a.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted, #888)' }}>
                        {a.tier} · {a.description || ''}
                      </div>
                    </div>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleRemoveAchievement(a.name)}
                      aria-label="Remove achievement"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      <AdminIcon name="Trash" size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAward}
                style={{
                  borderTop: '1px solid var(--admin-border, #333)',
                  paddingTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <h5 style={{ margin: 0, fontFamily: 'Rajdhani,sans-serif', fontSize: '0.85rem' }}>
                  Award New Achievement
                </h5>
                <input
                  type="text"
                  placeholder="Achievement name *"
                  value={newAchievement.name}
                  onChange={(e) => setNewAchievement((f) => ({ ...f, name: e.target.value }))}
                  required
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-border, #333)',
                    background: 'var(--admin-bg, #111)',
                    color: 'var(--admin-text, #eee)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newAchievement.description}
                  onChange={(e) =>
                    setNewAchievement((f) => ({ ...f, description: e.target.value }))
                  }
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-border, #333)',
                    background: 'var(--admin-bg, #111)',
                    color: 'var(--admin-text, #eee)',
                  }}
                />
                <select
                  value={newAchievement.tier}
                  onChange={(e) => setNewAchievement((f) => ({ ...f, tier: e.target.value }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-border, #333)',
                    background: 'var(--admin-bg, #111)',
                    color: 'var(--admin-text, #eee)',
                  }}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
                {achievementError && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>{achievementError}</div>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start' }}
                  disabled={awarding}
                >
                  {awarding ? 'Awarding…' : 'Award'}
                </button>
              </form>
            </div>
          ) : (
            <div className="empty-state">Select a portfolio to manage achievements.</div>
          )}
        </div>
      </div>
    </div>
  );
}
