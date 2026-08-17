import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../../utils/apiClient.js';
import { getApiBase } from '../../../utils/runtimeConfig';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';

export default function SessionPlayer() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await apiClient(`${base}/api/admin/analytics/recordings`, {
        credentials: 'include',
      });
      setRecordings(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    if (playerRef.current) {
      // Destroy old player
      containerRef.current.textContent = '';
    }

    try {
      const base = getApiBase();
      const events = await apiClient(`${base}/api/admin/analytics/recordings/${sessionId}`, {
        credentials: 'include',
      });

      if (!events || events.length < 2) {
        showFeedback('Not enough events to play', 'error');
        return;
      }

      playerRef.current = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events,
          autoPlay: true,
          width: 800,
          height: 600,
        },
      });
    } catch (e) {
      console.error('Playback error', e);
      showFeedback('Failed to load session events', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
      {feedback && (
        <div
          role="status"
          style={{
            maxWidth: '800px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor:
              feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: feedback.type === 'error' ? '#f87171' : '#34d399',
            border: `1px solid ${feedback.type === 'error' ? '#ef4444' : '#10b981'}`,
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          {feedback.message}
        </div>
      )}
      <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
        <div style={{ width: '300px', flexShrink: 0 }}>
          <h3>Recent Sessions</h3>
          {loading && <p>Loading...</p>}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            {recordings.map((rec) => (
              <div
                key={rec.id}
                onClick={() => playSession(rec.session_id)}
                style={{
                  padding: '1rem',
                  background:
                    activeSessionId === rec.session_id ? 'var(--c1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {rec.user_name || 'Anonymous'}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  {new Date(rec.start_time).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  {rec.device} - {rec.browser}
                </div>
              </div>
            ))}
            {recordings.length === 0 && !loading && <p>No recordings found.</p>}
          </div>
        </div>

        <div style={{ flexGrow: 1 }}>
          <div
            ref={containerRef}
            style={{
              width: '800px',
              height: '600px',
              background: '#000',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!activeSessionId && <span style={{ opacity: 0.5 }}>Select a session to playback</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
