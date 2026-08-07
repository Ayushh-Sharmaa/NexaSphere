import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { getApiBase } from '../../utils/runtimeConfig';
import { fallbackThreads, fallbackReplies } from '../../data/forumData.js';
import { EmptyState } from '../../components/EmptyState';
import HashtagText from '../../components/common/HashtagText';

// Formats a date string, falling back to a safe placeholder if the value
// is missing or cannot be parsed — avoids rendering literal "Invalid Date"
// text to users when the API returns a malformed or null timestamp.
function formatThreadDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString();
}

export default function ForumThreadPage({ onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const base = getApiBase();
    if (!base) {
      const t = fallbackThreads.find((th) => th.id === parseInt(id, 10));
      setThread(t || null);
      setReplies(fallbackReplies.filter((r) => r.threadId === parseInt(id, 10)));
      setLoading(false);
      return;
    }
    apiClient(`${base}/api/forum/threads/${id}`)
      .then((data) => {
        if (data?.thread) setThread(data.thread);
        if (data?.replies) setReplies(data.replies);
      })
      .catch(() => {
        const t = fallbackThreads.find((th) => th.id === parseInt(id, 10));
        setThread(t || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyAuthor.trim()) return;
    setError('');
    setSubmitting(true);
    const base = getApiBase();
    try {
      const data = await apiClient(`${base}/api/forum/threads/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          author_name: replyAuthor,
          author_email: replyEmail || undefined,
        }),
      });
      if (data?.reply) {
        setReplies((prev) => [...prev, data.reply]);
        setReplyContent('');
      }
    } catch (err) {
      setError(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (type, threadId, replyId) => {
    const base = getApiBase();
    const voterEmail = prompt('Enter your email to vote:');
    if (!voterEmail) return;
    try {
      const url = replyId
        ? `${base}/api/forum/replies/${replyId}/vote`
        : `${base}/api/forum/threads/${threadId}/vote`;
      const data = await apiClient(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_email: voterEmail, vote_type: type }),
      });
      if (data?.result) {
        if (replyId) {
          setReplies((prev) =>
            prev.map((r) =>
              r.id === replyId
                ? {
                    ...r,
                    upvotes:
                      r.upvotes +
                      (data.result.action === 'removed'
                        ? -1
                        : data.result.action === 'added'
                          ? 1
                          : 0),
                  }
                : r
            )
          );
        } else {
          setThread((prev) =>
            prev
              ? {
                  ...prev,
                  upvotes:
                    prev.upvotes +
                    (data.result.action === 'removed'
                      ? -1
                      : data.result.action === 'added'
                        ? 1
                        : 0),
                }
              : prev
          );
        }
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading thread...
      </div>
    );
  }

  if (!thread) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h2>Thread not found</h2>
        <button
          onClick={() => navigate('/forum')}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #CC1111, #880000)',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Back to Forum
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 100px' }}>
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,111,255,.04))',
          borderBottom: '1px solid var(--bdr)',
          padding: '40px 0 30px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
          <button
            onClick={() => navigate('/forum')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: 0,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← Back to Forum
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            {thread.isPinned && (
              <span style={{ fontSize: '0.8rem', color: '#CC1111' }}>📌 Pinned</span>
            )}
            {thread.isAnswered && (
              <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>✅ Answered</span>
            )}
            {thread.isLocked && (
              <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>🔒 Locked</span>
            )}
            <span
              style={{
                fontSize: '0.8rem',
                padding: '2px 10px',
                borderRadius: 12,
                background: 'rgba(204,17,17,0.1)',
                color: '#CC1111',
              }}
            >
              {thread.categoryName || 'General'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 700, margin: '0 0 8px' }}>
            {thread.title}
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Posted by {thread.authorName} · {formatThreadDate(thread.createdAt)} · Posted by{' '}
            {thread.authorName} · {new Date(thread.createdAt).toLocaleDateString()} ·{' '}
            {thread.viewCount || 0} views
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 12,
            border: '1px solid var(--bdr)',
            background: 'var(--surface)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                minWidth: 40,
              }}
            >
              <button
                onClick={() => handleVote('upvote', thread.id, null)}
                style={{
                  background: 'none',
                  border: '1px solid var(--bdr)',
                  borderRadius: 8,
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                ▲
              </button>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{thread.upvotes || 0}</span>
              <button
                onClick={() => handleVote('downvote', thread.id, null)}
                style={{
                  background: 'none',
                  border: '1px solid var(--bdr)',
                  borderRadius: 8,
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                ▼
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                <HashtagText text={thread.content} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {(thread.tags || []).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.8rem',
                      padding: '2px 10px',
                      borderRadius: 12,
                      background: 'rgba(123,111,255,0.1)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 16px' }}>
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length === 0 ? (
          <EmptyState
            title="No Replies Yet"
            description="Be the first to respond to this thread and start the conversation!"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {replies.map((reply) => (
              <div
                key={reply.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: reply.isAccepted ? '2px solid #22c55e' : '1px solid var(--bdr)',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      minWidth: 36,
                    }}
                  >
                    <button
                      onClick={() => handleVote('upvote', null, reply.id)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--bdr)',
                        borderRadius: 6,
                        width: 32,
                        height: 32,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      ▲
                    </button>
                    <span style={{ fontWeight: 600 }}>{reply.upvotes || 0}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {reply.authorName}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {formatThreadDate(reply.createdAt)}
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                      {reply.isAccepted && (
                        <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>
                          ✓ Accepted Answer
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      <HashtagText text={reply.content} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!thread.isLocked && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 12px' }}>
              Post a Reply
            </h3>
            <form onSubmit={handleReply}>
              <div style={{ marginBottom: 12 }}>
                <input
                  required
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  placeholder="Your name *"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--bdr)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="email"
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                  placeholder="Email (optional)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--bdr)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <MentionTextarea
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write your reply..."
                  rows={4}
                  className="ns-textarea"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--bdr)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>
              {error && (
                <div style={{ color: '#CC1111', marginBottom: 12, fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #CC1111, #880000)',
                  color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
