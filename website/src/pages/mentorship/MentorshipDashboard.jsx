import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Loader,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import {
  mentorships as fallbackMentorships,
  sessions as fallbackSessions,
} from '../../data/mentorshipData.js';
import { getApiBase } from '../../utils/runtimeConfig';

function formatSessionDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString();
}

async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  active: 'bg-green-500/10 text-green-300 border-green-500/30',
  completed: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
};

function MentorshipDashboard() {
  const [mentorships, setMentorships] = useState([]);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [showLogSession, setShowLogSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: '', notes: '', duration_minutes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    };
  }, []);

  const fetchMentorships = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      params.set('limit', '50');
      const data = await apiFetch(`/api/mentorship/requests?${params}`);
      setMentorships(data.mentorships || []);
    } catch {
      setMentorships(fallbackMentorships);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchMentorships();
  }, [fetchMentorships]);

  const fetchSessions = useCallback(async (mentorshipId) => {
    try {
      const data = await apiFetch(`/api/mentorship/requests/${mentorshipId}/sessions`);
      setSessions(data.sessions || []);
    } catch {
      setSessions(fallbackSessions.filter((s) => s.mentorshipId === mentorshipId));
    }
  }, []);

  const selectMentorship = (m) => {
    setSelectedMentorship(m);
    setShowLogSession(false);
    fetchSessions(m.id);
  };

  const handleLogSession = async () => {
    if (!sessionForm.title) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/mentorship/requests/${selectedMentorship.id}/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          title: sessionForm.title,
          notes: sessionForm.notes,
          duration_minutes: parseInt(sessionForm.duration_minutes, 10) || null,
        }),
      });
      showToast('Session logged!', 'success');
      setShowLogSession(false);
      setSessionForm({ title: '', notes: '', duration_minutes: '' });
      fetchSessions(selectedMentorship.id);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const myMentorships = mentorships.filter((m) => m.status === 'active' || m.status === 'pending');
  const pastMentorships = mentorships.filter(
    (m) => m.status === 'completed' || m.status === 'rejected'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Mentorship Dashboard
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Track your mentorship connections, log sessions, and monitor progress.
          </p>
        </div>

        {!email && (
          <div className="mb-8 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Email (to find your mentorships)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={fetchMentorships}
                className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700"
              >
                Load
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" /> Active Mentorships
              </h2>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : myMentorships.length === 0 ? (
                <p className="text-gray-500 text-center py-10">
                  No active mentorships. Browse mentors and send a request!
                </p>
              ) : (
                <div className="space-y-3">
                  {myMentorships.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => selectMentorship(m)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${selectedMentorship?.id === m.id ? 'border-purple-500 bg-purple-500/5' : 'border-gray-700 bg-gray-800 hover:border-purple-500/50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                            {m.mentorName?.[0] || 'M'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.mentorName}</p>
                            <p className="text-xs text-gray-500">{m.menteeName}</p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[m.status] || 'text-gray-400'}`}
                        >
                          {m.status}
                        </span>
                      </div>
                      {m.menteeDomain && (
                        <p className="text-xs text-gray-500 mb-1">Domain: {m.menteeDomain}</p>
                      )}
                      {m.menteeGoals && (
                        <p className="text-xs text-gray-500 line-clamp-1">{m.menteeGoals}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {m.sessionCount || 0} sessions
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[m.status] || 'text-gray-400'}`}
                        >
                          {m.status}
                        </span>
                      </div>
                      {m.menteeDomain && (
                        <p className="text-xs text-gray-500 mb-1">Domain: {m.menteeDomain}</p>
                      )}
                      {m.menteeGoals && (
                        <p className="text-xs text-gray-500 line-clamp-1">{m.menteeGoals}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {m.sessionCount || 0} sessions
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {pastMentorships.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 mt-8 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" /> Past Mentorships
                </h2>
                <div className="space-y-2">
                  {pastMentorships.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => selectMentorship(m)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${selectedMentorship?.id === m.id ? 'border-purple-500 bg-purple-500/5' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {m.mentorName} ↔ {m.menteeName}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[m.status] || ''}`}
                        >
                          {m.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedMentorship ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <h3 className="font-semibold mb-3">
                  Sessions with {selectedMentorship.mentorName}
                </h3>
                <button
                  onClick={() => setShowLogSession(!showLogSession)}
                  className="w-full mb-4 px-3 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Log New Session
                </button>

                {showLogSession && (
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg space-y-2">
                    <input
                      placeholder="Session title *"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <textarea
                      placeholder="Notes (optional)"
                      rows={2}
                      value={sessionForm.notes}
                      onChange={(e) => setSessionForm((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <input
                      placeholder="Duration (minutes)"
                      type="number"
                      value={sessionForm.duration_minutes}
                      onChange={(e) =>
                        setSessionForm((p) => ({ ...p, duration_minutes: e.target.value }))
                      }
                      className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleLogSession}
                      disabled={submitting || !sessionForm.title}
                      className="w-full px-3 py-1.5 bg-green-600 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : 'Save Session'}
                    </button>
                  </div>
                )}

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No sessions logged yet.
                    </p>
                  ) : (
                    sessions.map((s) => (
                      <div key={s.id} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{s.title}</p>
                          {s.durationMinutes && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {s.durationMinutes}m
                            </span>
                          )}
                        </div>
                        {s.notes && <p className="text-xs text-gray-400 line-clamp-2">{s.notes}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatSessionDate(s.sessionDate || s.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a mentorship to view sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default MentorshipDashboard;
