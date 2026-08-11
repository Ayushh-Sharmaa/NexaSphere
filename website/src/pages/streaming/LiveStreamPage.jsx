import React, { useState, useEffect, useRef, useCallback } from 'react';

// Validates a date value before formatting — avoids rendering literal
// "Invalid Date" text when the API returns a null or malformed timestamp.
function formatStreamDate(value) {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
}
function formatStreamTime(value) {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleTimeString();
}
import { getApiBase } from '../../utils/runtimeConfig';
import { useParams } from 'react-router-dom';
import {
  Play,
  Send,
  MessageSquare,
  BarChart3,
  Users,
  Radio,
  AlertCircle,
  X,
  Loader,
  ThumbsUp,
} from 'lucide-react';

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

function HlsPlayer({ streamUrl, hlsUrl, status }) {
  const videoRef = useRef(null);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
      {status === 'live' || status === 'scheduled' ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          {status === 'live' ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Radio className="w-10 h-10 text-red-400 animate-pulse" />
              </div>
              <p className="text-gray-400">Live stream in progress</p>
              {hlsUrl && (
                <video ref={videoRef} className="w-full h-full absolute inset-0" controls autoPlay>
                  <source src={hlsUrl} type="application/x-mpegURL" />
                </video>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-500 ml-1" />
              </div>
              <p className="text-gray-500">Stream not yet started</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          {streamUrl || hlsUrl ? (
            <video ref={videoRef} className="w-full h-full" controls>
              <source
                src={hlsUrl || streamUrl}
                type={hlsUrl ? 'application/x-mpegURL' : 'video/mp4'}
              />
            </video>
          ) : (
            <div className="text-center">
              <p className="text-gray-500">Recording not available</p>
            </div>
          )}
        </div>
      )}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {status === 'live' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
          </span>
        )}
        {status === 'ended' && (
          <span className="px-3 py-1 bg-gray-600 rounded-full text-xs">Ended</span>
        )}
        {status === 'archived' && (
          <span className="px-3 py-1 bg-blue-600 rounded-full text-xs">Recording</span>
        )}
      </div>
    </div>
  );
}

function ChatPanel({ messages, onSendMessage }) {
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return (localStorage.getItem('stream_chat_name') || '').slice(0, 50);
    } catch {
      return '';
    }
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !userName.trim()) return;
    onSendMessage({ user_name: userName, message: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium">Live Chat</span>
      </div>

      <div className="p-3 border-b border-gray-700">
        <input
          placeholder="Your name"
          value={userName}
          maxLength={50}
          onChange={(e) => {
            const trimmed = e.target.value.slice(0, 50);
            setUserName(trimmed);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('stream_chat_name', trimmed);
              } catch {
                // Ignore QuotaExceededError — name is still stored in state
              }
            }
          }}
          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages
          .filter((m) => !m.isModerated)
          .map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-medium text-purple-300">{m.userName}</span>{' '}
              <span className="text-gray-300">{m.message}</span>
            </div>
          ))}
        {messages.length === 0 && (
          <p className="text-gray-500 text-xs text-center py-8">No messages yet</p>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !userName.trim()}
          className="px-3 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PollPanel({ polls, onVote }) {
  const [votedPolls, setVotedPolls] = useState(new Set());

  const handleVote = (pollId, optionIndex) => {
    if (votedPolls.has(pollId)) return;
    onVote(pollId, optionIndex);
    setVotedPolls((prev) => new Set([...prev, pollId]));
  };

  const activePolls = polls.filter((p) => p.isActive);
  if (activePolls.length === 0) return null;

  return (
    <div className="space-y-3 p-3">
      {activePolls.map((poll) => {
        const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);
        return (
          <div key={poll.id} className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">{poll.question}</p>
            <div className="space-y-1.5">
              {poll.options.map((opt, idx) => {
                const count = poll.votes?.[String(idx)] || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <button
                    key={`${poll.id}-opt-${opt}`}
                    onClick={() => handleVote(poll.id, idx)}
                    disabled={votedPolls.has(poll.id)}
                    className="w-full relative overflow-hidden rounded bg-gray-600 px-3 py-2 text-left text-sm hover:bg-gray-500 transition disabled:opacity-80 disabled:cursor-default"
                  >
                    <div
                      className="absolute inset-0 bg-purple-500/20 transition-all"
                      style={{ width: `${votedPolls.has(poll.id) ? pct : 0}%` }}
                    />
                    <span className="relative flex items-center justify-between">
                      <span>{opt}</span>
                      {votedPolls.has(poll.id) && (
                        <span className="text-xs text-purple-300">{pct}%</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {votedPolls.has(poll.id) && (
              <p className="text-xs text-gray-500 mt-1">{totalVotes} votes</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LiveStreamPage() {
  const { eventId, streamId } = useParams();
  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [toast, setToast] = useState(null);
  const toastTimerRef = React.useRef(null);

  // Clear running timers when the stream layout unmounts
  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message, type) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  const fetchStream = useCallback(async () => {
    try {
      const endpoint = streamId ? `/api/streams/${streamId}` : `/api/streams/event/${eventId}`;
      const data = await apiFetch(endpoint);
      setStream(data.stream);
      return data.stream;
    } catch {
      return null;
    }
  }, [eventId, streamId]);

  const fetchMessages = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/api/streams/${id}/chat?limit=200`);
      setMessages(data.messages || []);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[LiveStreamPage] Failed to fetch messages:', err.message);
      }
    }
  }, []);

  const fetchPolls = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/api/streams/${id}/polls`);
      setPolls(data.polls || []);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[LiveStreamPage] Failed to fetch polls:', err.message);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading((prev) => (prev === true ? prev : true));
      setError(null);
      const s = await fetchStream();
      if (s) {
        await Promise.allSettled([fetchMessages(s.id), fetchPolls(s.id)]);
      } else if (!streamId) {
        setError('No stream found for this event.');
      }
      setLoading(false);
    })();
  }, [eventId, streamId, fetchStream, fetchMessages, fetchPolls]);

  const handleSendMessage = async ({ user_name, message }) => {
    if (!stream) return;
    try {
      const data = await apiFetch(`/api/streams/${stream.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ user_name, message }),
      });
      setMessages((prev) => [...prev, data.message]);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      await apiFetch(`/api/streams/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ option_index: optionIndex }),
      });
      showToast('Vote recorded!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!stream) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{stream.title}</h1>
          {stream.description && <p className="text-gray-400 text-sm mt-1">{stream.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" /> {stream.viewerCount || 0} viewers
            </span>
            {stream.scheduledStart && (
              <span>Scheduled: {formatStreamDate(stream.scheduledStart)}</span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <HlsPlayer streamUrl={stream.streamUrl} hlsUrl={stream.hlsUrl} status={stream.status} />

            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'chat' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-1.5" /> Chat ({messages.length})
                </button>
                <button
                  onClick={() => setActiveTab('polls')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'polls' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1.5" /> Polls (
                  {polls.filter((p) => p.isActive).length})
                </button>
              </div>

              {activeTab === 'chat' ? (
                <div className="h-[400px]">
                  <ChatPanel
                    streamId={stream.id}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <PollPanel polls={polls} onVote={handleVote} />
                  {polls.filter((p) => p.isActive).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No active polls</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400" /> Stream Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="font-medium">{stream.status.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Viewers</span>
                  <span className="font-medium">{stream.viewerCount}</span>
                </div>
                {stream.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Started</span>
                    <span className="font-medium">{formatStreamTime(stream.startedAt)}</span>
                  </div>
                )}
                {stream.endedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ended</span>
                    <span className="font-medium">{formatStreamTime(stream.endedAt)}</span>
                  </div>
                )}
                {stream.recordingDuration && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration</span>
                    <span className="font-medium">
                      {Math.floor(stream.recordingDuration / 60)}m {stream.recordingDuration % 60}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.type === 'success' ? (
            <ThumbsUp className="w-4 h-4" />
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

export default LiveStreamPage;
