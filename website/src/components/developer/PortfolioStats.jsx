import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const COLORS = {
  easy: '#00b8a3',
  medium: '#ffc01e',
  hard: '#ff375f',
};

export function LeetcodeStats({ stats }) {
  if (!stats || !stats.totalSolved) return null;

  const data = [
    { name: 'Easy', value: stats.easySolved, color: COLORS.easy },
    { name: 'Medium', value: stats.mediumSolved, color: COLORS.medium },
    { name: 'Hard', value: stats.hardSolved, color: COLORS.hard },
  ].filter((item) => item.value > 0);

  return (
    <div
      className="stats-container glass-panel"
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        marginTop: '16px',
      }}
    >
      <h4
        style={{
          fontSize: '0.9rem',
          color: 'var(--c2)',
          marginBottom: '16px',
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        LeetCode Stats
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '100px', height: '100px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={30}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  background: '#111',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--t1)',
            }}
          >
            {stats.totalSolved}{' '}
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--t3)',
                fontWeight: 'normal',
              }}
            >
              Solved
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--t2)', marginTop: '4px' }}>
            Global Rank: <strong>{stats.ranking?.toLocaleString() || 'N/A'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GithubStats({ stats }) {
  if (!stats || stats.publicRepos === undefined) return null;

  return (
    <div
      className="stats-container glass-panel"
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        marginTop: '16px',
      }}
    >
      <h4
        style={{
          fontSize: '0.9rem',
          color: 'var(--c1)',
          marginBottom: '16px',
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        GitHub Activity
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div
          style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'var(--t1)',
            }}
          >
            {stats.publicRepos}
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--t3)',
              textTransform: 'uppercase',
            }}
          >
            Public Repos
          </div>
        </div>
        <div
          style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'var(--t1)',
            }}
          >
            {stats.followers}
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--t3)',
              textTransform: 'uppercase',
            }}
          >
            Followers
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioStats({ githubStats, leetcodeStats }) {
  if (
    (!githubStats || Object.keys(githubStats).length === 0) &&
    (!leetcodeStats || Object.keys(leetcodeStats).length === 0)
  ) {
    return null;
  }

  return (
    <div className="portfolio-stats-wrapper">
      {githubStats && Object.keys(githubStats).length > 0 && <GithubStats stats={githubStats} />}
      {leetcodeStats && Object.keys(leetcodeStats).length > 0 && (
        <LeetcodeStats stats={leetcodeStats} />
      )}
    </div>
  );
}
