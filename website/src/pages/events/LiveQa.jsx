import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { initializeSocket, on, off } from '../../utils/socketClient';
import { MentionTextarea } from '../../components/common/MentionTextarea';

const SORT_OPTIONS = ['upvotes', 'recent', 'unanswered'];

export default function LiveQa({ eventId: propEventId, onBack }) {
  const { eventId: paramEventId } = useParams();
  const eventId = propEventId || paramEventId || '';
  const socketRef = useRef(null);

  const [activeTab, setActiveTab] = useState('qa');
  const [questions, setQuestions] = useState([]);
  const [polls, setPolls] = useState([]);
  const [sortBy, setSortBy] = useState('upvotes');
  const [questionText, setQuestionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [votedPolls, setVotedPolls] = useState({});
  const [answeredIds, setAnsweredIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const socket = initializeSocket();
    socketRef.current = socket;
    if (socket && eventId) {
      if (socket.id) setSocketId(socket.id);
      const handleConnect = () => setSocketId(socket.id);
      socket.on('connect', handleConnect);
      socket.emit('qa:join', { eventId });
      return () => {
        socket.emit('qa:leave', { eventId });
        socket.off('connect');
        socket.off('qa:list');
        socket.off('poll:list');
        socket.off('qa:asked');
        socket.close();
        socket.off('connect', handleConnect);
      };
    }
  }, [eventId]);

  const refreshQuestions = useCallback(
    (sort = sortBy) => {
      const socket = socketRef.current;
      if (!socket || !eventId) return;
      socket.emit('qa:list', { eventId, sortBy: sort });
      socket.once('qa:list', (data) => {
        if (data?.questions) setQuestions(data.questions);
      });
    },
    [eventId, sortBy]
  );

  const refreshPolls = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !eventId) return;
    socket.emit('poll:list', { eventId });
    socket.once('poll:list', (data) => {
      if (data?.polls) setPolls(data.polls);
    });
  }, [eventId]);

  useEffect(() => {
    if (activeTab === 'qa') refreshQuestions();
    else refreshPolls();
  }, [activeTab, refreshQuestions, refreshPolls]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewQ = () => refreshQuestions();
    const handleUpdated = () => refreshQuestions();
    const handleAnswered = (data) => {
      setAnsweredIds((prev) => new Set(prev).add(data.id));
      refreshQuestions();
    };
    const handleModerated = () => refreshQuestions();
    const handleRemoved = () => refreshQuestions();

    const handlePollNew = () => refreshPolls();
    const handlePollUpdated = () => refreshPolls();
    const handlePollClosed = () => refreshPolls();

    on('qa:new-question', handleNewQ);
    on('qa:updated', handleUpdated);
    on('qa:answered', handleAnswered);
    on('qa:moderated', handleModerated);
    on('qa:removed', handleRemoved);
    on('poll:new', handlePollNew);
    on('poll:updated', handlePollUpdated);
    on('poll:closed', handlePollClosed);

    return () => {
      off('qa:new-question', handleNewQ);
      off('qa:updated', handleUpdated);
      off('qa:answered', handleAnswered);
      off('qa:moderated', handleModerated);
      off('qa:removed', handleRemoved);
      off('poll:new', handlePollNew);
      off('poll:updated', handlePollUpdated);
      off('poll:closed', handlePollClosed);
    };
  }, [refreshQuestions, refreshPolls]);

  const handleAsk = (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    const socket = socketRef.current;
    if (!socket) return;
    setSubmitting(true);
    socket.emit('qa:ask', {
      eventId,
      askedBy: isAnonymous ? 'Anonymous' : userName || 'Attendee',
      email: userEmail,
      text: questionText,
      isAnonymous,
    });
    socket.once('qa:asked', () => {
      setQuestionText('');
      setSubmitting(false);
      refreshQuestions();
    });
    setTimeout(() => setSubmitting(false), 2000);
  };

  const handleUpvote = (questionId) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('qa:upvote', { eventId, questionId });
  };

  const handleVote = (pollId, optionId) => {
    if (votedPolls[pollId]) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('poll:vote', { eventId, pollId, optionIds: [optionId] });
    setVotedPolls((prev) => ({ ...prev, [pollId]: true }));
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px 16px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
    },
    backBtn: {
      background: 'none',
      border: '1px solid var(--border)',
      color: 'var(--t1)',
      borderRadius: '6px',
      padding: '6px 12px',
      cursor: 'pointer',
      fontSize: '0.85rem',
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      borderBottom: '1px solid var(--border)',
      paddingBottom: '8px',
    },
    tab: (active) => ({
      background: active ? 'var(--c1, #CC1111)' : 'none',
      color: active ? '#fff' : 'var(--t1)',
      border: '1px solid transparent',
      borderRadius: '6px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontWeight: active ? 600 : 400,
    }),
    card: {
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      borderRadius: '10px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid var(--border)',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      color: 'var(--t1)',
      fontSize: '0.9rem',
      boxSizing: 'border-box',
    },
    btn: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 500,
    },
    badge: (variant) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      background: variant === 'accent' ? 'var(--c1, #CC1111)' : 'var(--bg-subtle, #333)',
      color: variant === 'accent' ? '#fff' : 'var(--t2)',
      marginRight: '6px',
    }),
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {onBack && (
          <button style={styles.backBtn} onClick={onBack}>
            ← Back
          </button>
        )}
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Live Q&amp;A</h1>
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'qa')} onClick={() => setActiveTab('qa')}>
          Questions
        </button>
        <button style={styles.tab(activeTab === 'polls')} onClick={() => setActiveTab('polls')}>
          Polls
        </button>
      </div>

      {activeTab === 'qa' && (
        <>
          <form onSubmit={handleAsk} style={{ ...styles.card, marginBottom: '20px' }}>
            <MentionTextarea
              style={{
                ...styles.input,
                minHeight: '60px',
                resize: 'vertical',
                marginBottom: '8px',
              }}
              placeholder="Ask a question…"
              value={questionText}
              onChange={setQuestionText}
            />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                style={{ ...styles.input, flex: 1, minWidth: '120px' }}
                placeholder="Your name (optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <input
                style={{ ...styles.input, flex: 1, minWidth: '120px' }}
                type="email"
                placeholder="Email (optional)"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Anonymous
              </label>
              <button
                type="submit"
                style={{ ...styles.btn, background: 'var(--c1, #CC1111)', color: '#fff' }}
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Ask'}
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt}
                style={{
                  ...styles.btn,
                  background: sortBy === opt ? 'var(--c1, #CC1111)' : 'var(--bg-subtle, #333)',
                  color: sortBy === opt ? '#fff' : 'var(--t1)',
                }}
                onClick={() => {
                  setSortBy(opt);
                  refreshQuestions(opt);
                }}
              >
                {opt === 'upvotes' ? 'Top' : opt === 'recent' ? 'Recent' : 'Unanswered'}
              </button>
            ))}
          </div>

          {questions.length === 0 && (
            <p style={{ color: 'var(--t2)', textAlign: 'center', padding: '40px 0' }}>
              No questions yet. Be the first to ask!
            </p>
          )}

          {questions.map((q) => (
            <div
              key={q.id}
              style={{
                ...styles.card,
                borderLeft: q.isFeatured ? '4px solid var(--c1, #CC1111)' : '4px solid transparent',
                opacity: q.status === 'duplicate' ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={styles.badge()}>{q.askedBy}</span>
                    {q.isFeatured && <span style={styles.badge('accent')}>Featured</span>}
                    {q.status === 'answered' && (
                      <span style={{ ...styles.badge(), background: '#166534', color: '#fff' }}>
                        Answered
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 8px', fontWeight: 500 }}>{q.text}</p>
                  {q.answer && (
                    <div
                      style={{
                        background: 'var(--bg-subtle, #222)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        marginTop: '8px',
                        borderLeft: '3px solid var(--c1, #CC1111)',
                      }}
                    >
                      <small style={{ fontWeight: 600, color: 'var(--c1, #CC1111)' }}>
                        {q.answeredBy}:
                      </small>
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{q.answer}</p>
                    </div>
                  )}
                </div>
                <button
                  style={{
                    ...styles.btn,
                    background: 'none',
                    border: '1px solid var(--border)',
                    color: 'var(--t1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    minWidth: '50px',
                  }}
                  onClick={() => handleUpvote(q.id)}
                >
                  <span>▲</span>
                  <span style={{ fontWeight: 600, marginTop: '2px' }}>{q.upvotes}</span>
                </button>
              </div>
              {answeredIds.has(q.id) && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--c1, #CC1111)',
                    fontWeight: 500,
                  }}
                >
                  ✦ Your question was answered!
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {activeTab === 'polls' && (
        <>
          {polls.length === 0 && (
            <p style={{ color: 'var(--t2)', textAlign: 'center', padding: '40px 0' }}>
              No active polls right now.
            </p>
          )}
          {polls.map((poll) => {
            const total = poll.totalVotes || poll.options.reduce((s, o) => s + o.votes, 0);
            const hasVoted =
              votedPolls[poll.id] || poll.options.some((o) => o.voters?.includes(socketId));
            return (
              <div key={poll.id} style={styles.card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{poll.question}</h3>
                  <span
                    style={{
                      ...styles.badge(poll.status === 'active' ? 'accent' : ''),
                      fontSize: '0.7rem',
                    }}
                  >
                    {poll.status === 'active' ? 'Open' : 'Closed'}
                  </span>
                </div>
                {poll.options.map((opt) => {
                  const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                  const isSelected = hasVoted && opt.voters?.includes(socketId);
                  return (
                    <div key={opt.id} style={{ marginBottom: '8px' }}>
                      <button
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'var(--bg-subtle, #222)',
                          border: hasVoted ? '1px solid var(--border)' : '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: 'var(--t1)',
                          cursor: hasVoted || poll.status !== 'active' ? 'default' : 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleVote(poll.id, opt.id)}
                        disabled={hasVoted || poll.status !== 'active'}
                      >
                        <span>{opt.text}</span>
                        {hasVoted && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                            {opt.votes} ({pct}%)
                          </span>
                        )}
                      </button>
                      {hasVoted && (
                        <div
                          style={{
                            background: 'var(--bg-subtle, #333)',
                            borderRadius: '4px',
                            height: '6px',
                            marginTop: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: 'var(--c1, #CC1111)',
                              borderRadius: '4px',
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ fontSize: '0.8rem', color: 'var(--t2)', marginTop: '4px' }}>
                  {total} vote{total !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
