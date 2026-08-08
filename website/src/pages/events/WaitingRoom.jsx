import { useState, useEffect, useCallback } from 'react';
import { initializeSocket, getSocket, on, off, emit } from '../../utils/socketClient';
import { getEstimatedWaitMinutes } from './waitingRoomUtils.js';

export default function WaitingRoom({ eventId, fullName, email, onJoinEvent }) {
  const [status, setStatus] = useState('connecting');
  const [position, setPosition] = useState(null);
  const [total, setTotal] = useState(null);
  const [message, setMessage] = useState('');
  const [waitTime, setWaitTime] = useState(null);

  useEffect(() => {
    const socket = initializeSocket();
    if (!socket) {
      setStatus('offline');
      return;
    }

    const handleJoined = (data) => {
      setStatus('waiting');
      setPosition(data.position);
      setTotal(data.total);
      estimateWait(data.position);
    };

    const handleQueueUpdate = (data) => {
      if (data.position === 0) {
        setPosition((prev) => (prev != null && prev > 0 ? prev - 1 : 0));
      } else {
        setPosition(data.position);
      }
      setTotal(data.total);
      estimateWait(data.position ?? position);
    };

    const handleAdmitted = () => {
      setStatus('admitted');
      if (onJoinEvent) onJoinEvent();
    };

    const handleMessage = (data) => {
      setMessage(data.message);
      setTimeout(() => setMessage(''), 10000);
    };

    const handleStatusUpdate = (data) => {
      const myEntry = data.queue.find((e) => e.email === email);
      if (myEntry) {
        setPosition(myEntry.position);
        setTotal(data.total);
        estimateWait(myEntry.position);
      }
    };

    on('waiting:joined', handleJoined);
    on('waiting:queue-update', handleQueueUpdate);
    on('waiting:admitted', handleAdmitted);
    on('waiting:message', handleMessage);
    on('waiting:status:update', handleStatusUpdate);

    emit('waiting:join', { eventId, fullName, email });

    const pollInterval = setInterval(() => {
      emit('waiting:status', { eventId });
    }, 10000);

    return () => {
      off('waiting:joined', handleJoined);
      off('waiting:queue-update', handleQueueUpdate);
      off('waiting:admitted', handleAdmitted);
      off('waiting:message', handleMessage);
      off('waiting:status:update', handleStatusUpdate);
      clearInterval(pollInterval);
    };
  }, [eventId, fullName, email, onJoinEvent, position]);

  const estimateWait = (pos) => {
    if (pos === null || pos === undefined) return;
    setWaitTime(getEstimatedWaitMinutes(pos));
  };

  if (status === 'offline') {
    return (
      <div className="waiting-room-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>You're Registered!</h3>
        <p style={{ color: 'var(--t2)' }}>
          Waiting room is only available during live events. You'll receive a notification when the
          event starts.
        </p>
      </div>
    );
  }

  if (status === 'admitted') {
    return (
      <div
        className="waiting-room-card"
        style={{
          textAlign: 'center',
          padding: '40px',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(22,163,74,0.02))',
          border: '1px solid rgba(22,163,74,0.2)',
          borderRadius: '16px',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
        <h3>You're In!</h3>
        <p style={{ color: 'var(--t2)' }}>Welcome to the event. Enjoy!</p>
      </div>
    );
  }

  return (
    <div
      className="waiting-room-card"
      style={{
        padding: '32px',
        borderRadius: '16px',
        background: 'var(--card)',
        border: '1px solid var(--bdr)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--c1a)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--c1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3 style={{ marginBottom: '4px' }}>Waiting Room</h3>
        <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>You're in the queue. Hang tight!</p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          marginBottom: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--c1)' }}>
            {position ?? '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>Position</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--t1)' }}>
            {total ?? '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>Total Waiting</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--t1)' }}>
            {waitTime === 0 ? 'Ready' : waitTime != null ? `~${waitTime}m` : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>Est. Wait</div>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            marginBottom: '16px',
            fontSize: '0.85rem',
          }}
        >
          <strong>📢 {message}</strong>
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          background: 'var(--bdr)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '2px',
            background: 'var(--c1)',
            transition: 'width 0.5s ease',
            width:
              position != null && total
                ? position === 0
                  ? '100%'
                  : `${((total - position + 1) / total) * 100}%`
                : '0%',
          }}
        />
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '0.78rem',
          color: 'var(--t3)',
        }}
      >
        Don't close this page — you'll be automatically admitted when it's your turn.
      </p>
    </div>
  );
}
