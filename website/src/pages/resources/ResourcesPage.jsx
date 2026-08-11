import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ResourceCard from '../../components/resources/ResourceCard';
import ResourceUploadModal from '../../components/resources/ResourceUploadModal';
import {
  resourcesData as fallbackResources,
  categories,
  topics,
  difficultyLevels,
} from '../../data/resourcesData';
import apiClient from '../../utils/apiClient';
import { getApiBase } from '../../utils/runtimeConfig';

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadSet(key) {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveSet(key, set) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore quota errors */
  }
}

// ── Stat badge ────────────────────────────────────────────────────────────────
function StatBadge({ icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 20px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        minWidth: '100px',
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)' }}>{value}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ResourcesPage({ onBack }) {
  const [resources, setResources] = useState(fallbackResources);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const showToast = useCallback((message, type) => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedAccess, setSelectedAccess] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [votedIds, setVotedIds] = useState(() => loadSet('ns_resource_voted_ids'));
  const [bookmarkedIds, setBookmarkedIds] = useState(() => loadSet('ns_resource_bookmarks'));

  // ── Fetch from backend if available ────────────────────────────────────────
  useEffect(() => {
    const base = getApiBase();
    if (!base) return;
    setLoading(true);
    apiClient(`${base}/api/resources?limit=50`)
      .then((data) => {
        if (data && Array.isArray(data.resources)) {
          const approved = data.resources.filter((r) => r.status === 'approved');
          if (approved.length) setResources(approved);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Filter + Sort ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...resources];

    if (showBookmarksOnly) {
      result = result.filter((r) => bookmarkedIds.has(r.id));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (r.eventTitle || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategory) result = result.filter((r) => r.category === selectedCategory);
    if (selectedTopic) result = result.filter((r) => r.topic === selectedTopic);
    if (selectedDifficulty) result = result.filter((r) => r.difficultyLevel === selectedDifficulty);
    if (selectedAccess) result = result.filter((r) => r.accessLevel === selectedAccess);

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'popular') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'votes') return (b.votes?.length || 0) - (a.votes?.length || 0);
      return 0;
    });

    return result;
  }, [
    resources,
    searchQuery,
    selectedCategory,
    selectedTopic,
    selectedDifficulty,
    selectedAccess,
    sortBy,
    showBookmarksOnly,
    bookmarkedIds,
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleVote = (id) => {
    const hasVoted = votedIds.has(id);
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const votes = r.votes || [];
        return { ...r, votes: hasVoted ? votes.slice(0, -1) : [...votes, 'current_user'] };
      })
    );
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveSet('ns_resource_voted_ids', next);
      return next;
    });

    const base = getApiBase();
    if (base) {
      apiClient(`${base}/api/resources/${id}/vote`, { method: 'POST' }).catch(() => {
        // revert on failure
        setResources((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
            const votes = r.votes || [];
            return { ...r, votes: hasVoted ? [...votes, 'current_user'] : votes.slice(0, -1) };
          })
        );
        setVotedIds((prev) => {
          const next = new Set(prev);
          if (hasVoted) next.add(id);
          else next.delete(id);
          saveSet('ns_resource_voted_ids', next);
          return next;
        });
        showToast('Could not register your vote. Please try again.', 'error');
      });
    }
  };

  const handleDownload = (id) => {
    const base = getApiBase();
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, downloads: (r.downloads || 0) + 1 } : r))
    );
    if (base) {
      apiClient(`${base}/api/resources/${id}/download`, { method: 'POST' }).catch(() => {
        // revert the optimistic download count bump on failure
        setResources((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, downloads: Math.max((r.downloads || 1) - 1, 0) } : r
          )
        );
        showToast('Could not register your download. Please try again.', 'error');
      });
    }
  };

  const handleBookmark = (id) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveSet('ns_resource_bookmarks', next);
      return next;
    });
  };

  const handleSubmitResource = (resource) => {
    const newResource = {
      ...resource,
      id: Date.now().toString(),
      downloads: 0,
      votes: [],
      status: 'pending',
      accessLevel: 'public',
    };
    setResources((prev) => [newResource, ...prev]);
    setShowUploadModal(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTopic('');
    setSelectedDifficulty('');
    setSelectedAccess('');
    setSortBy('newest');
    setShowBookmarksOnly(false);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory ||
    selectedTopic ||
    selectedDifficulty ||
    selectedAccess ||
    showBookmarksOnly;

  const totalDownloads = resources.reduce((s, r) => s + (r.downloads || 0), 0);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 60px' }}>
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'error' ? '#ef4444' : '#22c55e',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          {toast.message}
        </div>
      )}
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--t2)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          padding: '8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        ← Back to Home
      </button>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--t1)' }}>📚 Resource Library</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--t3)', fontSize: '0.9rem' }}>
            Community-curated study materials, templates, notes, session recordings & more
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#CC1111',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          + Share Resource
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        <StatBadge icon="📚" label="Resources" value={resources.length} />
        <StatBadge icon="⬇" label="Downloads" value={totalDownloads.toLocaleString()} />
        <StatBadge icon="🔖" label="Bookmarked" value={bookmarkedIds.size} />
        <StatBadge
          icon="🌐"
          label="Public"
          value={resources.filter((r) => r.accessLevel === 'public').length}
        />
      </div>

      {/* Search + filters */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
        }}
      >
        {/* Search row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by title, description, tags, or event…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="newest">📅 Newest</option>
            <option value="popular">⬇ Most Downloaded</option>
            <option value="votes">👍 Most Voted</option>
          </select>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          >
            <option value="">All Levels</option>
            {difficultyLevels.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            value={selectedAccess}
            onChange={(e) => setSelectedAccess(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          >
            <option value="">All Access</option>
            <option value="public">🌐 Public</option>
            <option value="members">🔵 Members Only</option>
            <option value="attendees">🎟️ Attendees Only</option>
          </select>

          {/* Bookmark filter toggle */}
          <button
            onClick={() => setShowBookmarksOnly((v) => !v)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              border: `1px solid ${showBookmarksOnly ? 'var(--c1)' : 'var(--border)'}`,
              background: showBookmarksOnly ? 'var(--c1a, rgba(242,92,102,0.1))' : 'var(--bg)',
              color: showBookmarksOnly ? 'var(--c1)' : 'var(--t2)',
              cursor: 'pointer',
              fontWeight: showBookmarksOnly ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            🔖 Bookmarks {bookmarkedIds.size > 0 && `(${bookmarkedIds.size})`}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--t3)',
                cursor: 'pointer',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p style={{ fontSize: '0.82rem', color: 'var(--t3)', marginBottom: '16px' }}>
          Showing {filtered.length} of {resources.length} resource
          {resources.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)' }}>
          Loading resources…
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
            {showBookmarksOnly ? '🔖' : '📚'}
          </div>
          <p style={{ fontSize: '1rem', margin: '0 0 8px', color: 'var(--t2)' }}>
            {showBookmarksOnly ? 'No bookmarks yet' : 'No resources found'}
          </p>
          <p style={{ fontSize: '0.85rem', margin: '0 0 20px' }}>
            {showBookmarksOnly
              ? 'Click the 📌 icon on any resource to save it here.'
              : 'Try adjusting your search or filters, or share a new resource!'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onVote={handleVote}
              onDownload={handleDownload}
              votedByUser={votedIds.has(resource.id)}
              bookmarked={bookmarkedIds.has(resource.id)}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}

      <ResourceUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleSubmitResource}
      />
    </div>
  );
}
