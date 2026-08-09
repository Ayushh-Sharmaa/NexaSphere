import { useState, useEffect, useMemo } from 'react';

// Validates a date value before formatting — avoids rendering literal
// "Invalid Date" text when the API returns a null or malformed timestamp.
function formatThreadDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString();
}
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { getApiBase } from '../../utils/runtimeConfig';
import { fallbackCategories, fallbackThreads } from '../../data/forumData.js';
import Footer from '../../shared/Footer';
import { EmptyState } from '../../components/EmptyState';
import { ForumPostSkeleton } from '../../components/ui/skeleton/ForumPostSkeleton';
import TrendingHashtags from '../../components/forum/TrendingHashtags';

export default function ForumPage({ onBack }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(fallbackCategories);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('latest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: 1,
    author_name: '',
    author_email: '',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const base = getApiBase();
    if (!base) {
      setThreads(fallbackThreads);
      setLoading(false);
      return;
    }
    Promise.allSettled([
      apiClient(`${base}/api/forum/categories`),
      apiClient(
        `${base}/api/forum/threads?sort=${sort}${activeCategory ? `&category=${activeCategory}` : ''}`
      ),
    ])
      .then(([catResult, threadResult]) => {
        // Handle each result independently so one endpoint failure
        // doesn't discard successfully-fetched data from the other.
        if (catResult.status === 'fulfilled') {
          if (catResult.value?.categories) setCategories(catResult.value.categories);
        } else {
          if (import.meta.env.DEV) {
            console.warn('[ForumPage] Categories fetch failed:', catResult.reason?.message);
          }
          setCategories(fallbackCategories);
        }
        if (threadResult.status === 'fulfilled') {
          if (threadResult.value?.threads) setThreads(threadResult.value.threads);
        } else {
          if (import.meta.env.DEV) {
            console.warn('[ForumPage] Threads fetch failed:', threadResult.reason?.message);
          }
          setThreads(fallbackThreads);
        }
      })
      .finally(() => setLoading(false));
  }, [sort, activeCategory]);

  const filteredThreads = useMemo(() => {
    let result = threads;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      result = result.filter(
        (t) => t.categorySlug === activeCategory || t.categoryId.toString() === activeCategory
      );
    }
    return result;
  }, [threads, searchQuery, activeCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const base = getApiBase();
    if (!base) {
      setError('Forum is in offline mode. Please try again later.');
      setSubmitting(false);
      return;
    }
    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id, 10),
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      const data = await apiClient(`${base}/api/forum/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (data?.thread) {
        setThreads((prev) => [data.thread, ...prev]);
        setShowCreateModal(false);
        setFormData({
          title: '',
          content: '',
          category_id: 1,
          author_name: '',
          author_email: '',
          tags: '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 100px' }}>
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,111,255,.04))',
          borderBottom: '1px solid var(--bdr)',
          padding: '70px 0 50px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 700, marginBottom: 8 }}>
          Discussion Forum
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto',
            fontSize: '1rem',
          }}
        >
          Ask questions, share insights, and connect with the community
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            marginTop: 20,
            padding: '10px 28px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #CC1111, #880000)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New Thread
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => setActiveCategory('')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: '1px solid var(--bdr)',
              background: !activeCategory ? 'var(--accent)' : 'transparent',
              color: !activeCategory ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: '1px solid var(--bdr)',
                background: activeCategory === cat.slug ? 'var(--accent)' : 'transparent',
                color: activeCategory === cat.slug ? '#fff' : 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--bdr)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.9rem',
            }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--bdr)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.9rem',
            }}
          >
            <option value="latest">Latest</option>
            <option value="top">Top Voted</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {loading ? (
              <ForumPostSkeleton count={5} />
            ) : filteredThreads.length === 0 ? (
              <EmptyState
                title="No Threads Found"
                description="No threads match your current filters. Try adjusting your search or selecting a different category."
                action={
                  <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    Start a New Discussion
                  </button>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => navigate(`/forum/${thread.id}`)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 12,
                      border: '1px solid var(--bdr)',
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      opacity: thread.status === 'rejected' ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ textAlign: 'center', minWidth: 50 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                          {thread.upvotes || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          votes
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4 }}>
                          {thread.replyCount || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          replies
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          {thread.isPinned && (
                            <span style={{ fontSize: '0.75rem', color: '#CC1111' }}>📌 Pinned</span>
                          )}
                          {thread.isAnswered && (
                            <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                              ✅ Answered
                            </span>
                          )}
                          {thread.isLocked && (
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>🔒 Locked</span>
                          )}
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: 'rgba(204,17,17,0.1)',
                              color: '#CC1111',
                            }}
                          >
                            {thread.categoryName || 'General'}
                          </span>
                        </div>
                        <h3 style={{ margin: '4px 0', fontSize: '1.05rem', fontWeight: 600 }}>
                          {thread.title}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {thread.content}
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          {(thread.tags || []).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: 'rgba(123,111,255,0.1)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginTop: 8,
                          }}
                        >
                          by {thread.authorName} · {formatThreadDate(thread.createdAt)}
                          by {thread.authorName} · {new Date(thread.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <TrendingHashtags />
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: '32px',
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: '1.3rem' }}>Create New Thread</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--bdr)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Title *
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What is your question or topic?"
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
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your question or discussion in detail..."
                  rows={6}
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
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Your Name *
                </label>
                <input
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
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
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.author_email}
                  onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
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
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Tags (comma separated)
                </label>
                <input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. javascript, help, question"
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
              {error && (
                <div style={{ color: '#CC1111', marginBottom: 12, fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid var(--bdr)',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
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
                  {submitting ? 'Posting...' : 'Post Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer onAdmin={() => {}} onProjects={() => {}} onRoadmaps={() => {}} />
    </div>
  );
}
