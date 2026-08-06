import React from 'react';

export default function Leaderboard({ users, currentUserId, timeframe, setTimeframe }) {
  const tabs = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div
      className="leaderboard"
      style={{
        background: 'var(--bg-glass)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--b2)',
      }}
    >
      <h3 style={{ color: 'var(--t1)', marginBottom: '16px' }}>🏆 Top Tech Explorers</h3>

      {/* Timeframe Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTimeframe(tab.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: timeframe === tab.id ? 'var(--c1)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(!users || users.length === 0) && (
          <p style={{ color: 'var(--t2)', margin: '8px 0 0' }}>
            No leaderboard data available right now.
          </p>
        )}
        {users?.some((u) => u.isSample) && (
          <p style={{ color: '#f59e0b', margin: '0 0 8px', fontSize: '0.85rem' }}>
            Sample data — not live rankings.
          </p>
        )}
        {users?.map((user, index) => {
          const isMe = user.id === currentUserId;

          return (
            <div
              key={user.id || user.rank || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: '8px',
                background: isMe ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                border: isMe ? '1px solid rgba(255, 215, 0, 0.5)' : 'none',
              }}
            >
              <span
                style={{
                  color: isMe ? '#FFD700' : 'inherit',
                  fontWeight: isMe ? 'bold' : 'normal',
                }}
              >
                {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : `#${index + 1} `}
                {user.username || user.name} {isMe && '(You)'}
                {user.isSample ? ' (sample)' : ''}
              </span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {user.streak > 0 && (
                  <span
                    title={`${user.streak} day streak!`}
                    style={{
                      color: '#F59E0B',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {user.streak} 🔥
                  </span>
                )}
                <span
                  style={{
                    color: isMe ? '#FFD700' : 'inherit',
                    fontWeight: isMe ? 'bold' : 'normal',
                  }}
                >
                  {user.xp} XP
                </span>
              </div>
              <span
                style={{
                  color: isMe ? '#FFD700' : 'inherit',
                  fontWeight: isMe ? 'bold' : 'normal',
                }}
              >
                {user.xp} XP
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
