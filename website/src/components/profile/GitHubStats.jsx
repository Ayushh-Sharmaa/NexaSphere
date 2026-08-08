import React, { useState, useEffect } from 'react';
import { Github, Users, Book, Star } from 'lucide-react';

export default function GitHubStats({ githubUrl }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!githubUrl) return;

    // Extract username from URL (e.g. https://github.com/username)
    let username = '';
    try {
      const url = new URL(githubUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        username = parts[0];
      }
    } catch (e) {
      setError(true);
      setLoading(false);
      return;
    }

    if (!username) {
      setError(true);
      setLoading(false);
      return;
    }

    fetch(`https://api.github.com/users/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch github stats', err);
        setError(true);
        setLoading(false);
      });
  }, [githubUrl]);

  if (!githubUrl || error) return null;
  if (loading)
    return (
      <div className="bg-[#1e293b] rounded-xl p-4 border border-white/10 animate-pulse flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="bg-[#1e293b] rounded-xl p-5 border border-white/10 transition-all hover:bg-[#253247]">
      <div className="flex items-center gap-3 mb-4">
        <Github size={24} className="text-white" />
        <h3 className="font-bold text-white text-lg">GitHub Stats</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-lg p-3 flex flex-col items-center justify-center border border-white/5">
          <Book size={18} className="text-indigo-400 mb-1" />
          <span className="text-2xl font-black text-white">{stats.public_repos}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
            Repositories
          </span>
        </div>

        <div className="bg-black/20 rounded-lg p-3 flex flex-col items-center justify-center border border-white/5">
          <Users size={18} className="text-blue-400 mb-1" />
          <span className="text-2xl font-black text-white">{stats.followers}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
            Followers
          </span>
        </div>

        <div className="bg-black/20 rounded-lg p-3 flex flex-col items-center justify-center border border-white/5 col-span-2">
          <Star size={18} className="text-yellow-400 mb-1" />
          <span className="text-2xl font-black text-white">{stats.public_gists}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
            Gists
          </span>
        </div>
      </div>

      <a
        href={githubUrl}
        target="_blank"
        rel="noreferrer"
        className="block mt-4 text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        View on GitHub &rarr;
      </a>
    </div>
  );
}
