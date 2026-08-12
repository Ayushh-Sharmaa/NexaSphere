import React from 'react';

interface GithubStats {
  public_repos?: number;
  followers?: number;
  avatar_url?: string;
  bio?: string;
}

interface LeetcodeStats {
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  ranking?: number;
}

interface PortfolioData {
  id: string;
  member_id: string;
  full_name: string;
  role: string;
  github_username?: string | null;
  leetcode_username?: string | null;
  cached_github_stats?: GithubStats | null;
  cached_leetcode_stats?: LeetcodeStats | null;
  last_synced_at?: string | null;
  is_cached?: boolean;
}

interface PortfolioCardProps {
  portfolio: PortfolioData;
}

function InitialsAvatar({ name }: { name: string }) {
  const initials =
    name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-semibold text-lg shrink-0">
      {initials}
    </div>
  );
}

function StatBlock({
  label,
  value,
  color = 'text-white',
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold tracking-tight leading-none text-white">
        {value ?? '—'}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium mt-1">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return <div className="w-px h-8 bg-white/10 self-center" />;
}

function GithubPanel({ stats }: { stats?: GithubStats | null }) {
  if (!stats) {
    return (
      <div className="rounded-lg bg-white/[3%] border border-white/5 p-3 flex items-center justify-center text-white/25 text-xs h-20">
        No GitHub data
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white/[3%] border border-white/5 p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
          GitHub
        </span>
      </div>
      <div className="flex items-center justify-around gap-2">
        <StatBlock label="Repos" value={stats.public_repos ?? 0} />
        <Separator />
        <StatBlock label="Followers" value={stats.followers ?? 0} />
      </div>
      {stats.bio && (
        <p className="text-[11px] text-white/40 mt-2 leading-relaxed line-clamp-2 text-center">
          {stats.bio}
        </p>
      )}
    </div>
  );
}

function LeetcodePanel({ stats }: { stats?: LeetcodeStats | null }) {
  if (!stats) {
    return (
      <div className="rounded-lg bg-white/[3%] border border-white/5 p-3 flex items-center justify-center text-white/25 text-xs h-20">
        No LeetCode data
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white/[3%] border border-white/5 p-3">
      <div className="flex items-center justify-center gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
          LeetCode
        </span>
      </div>

      <div className="text-center mb-2.5">
        <span className="text-2xl font-bold text-white leading-none">{stats.totalSolved ?? 0}</span>
        <span className="text-[10px] text-white/40 ml-1.5 font-medium">solved</span>
      </div>

      <div className="flex items-center justify-around gap-1">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-emerald-400 leading-none">
            {stats.easySolved ?? 0}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-white/30 mt-0.5">Easy</span>
        </div>
        <Separator />
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-amber-400 leading-none">
            {stats.mediumSolved ?? 0}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-white/30 mt-0.5">Med</span>
        </div>
        <Separator />
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-red-400 leading-none">
            {stats.hardSolved ?? 0}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-white/30 mt-0.5">Hard</span>
        </div>
      </div>

      {stats.ranking != null && stats.ranking > 0 && (
        <p className="text-[10px] text-white/30 text-center mt-2">
          Ranking: #{stats.ranking.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const { full_name, role, cached_github_stats, cached_leetcode_stats } = portfolio;

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          {cached_github_stats?.avatar_url ? (
            <img
              loading="lazy"
              src={cached_github_stats.avatar_url}
              alt={full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shrink-0"
            />
          ) : (
            <InitialsAvatar name={full_name} />
          )}

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{full_name}</h3>
            <p className="text-xs text-white/50 mt-0.5 truncate">{role || 'Community Member'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GithubPanel stats={cached_github_stats} />
          <LeetcodePanel stats={cached_leetcode_stats} />
        </div>
      </div>
    </div>
  );
}
