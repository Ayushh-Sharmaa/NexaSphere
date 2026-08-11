import { formatFileSize } from '../../data/resourcesData';

function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const categoryGradients = {
  study_material: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
  project_template: 'linear-gradient(135deg, #0f9d58, #1b5e20)',
  notes: 'linear-gradient(135deg, #e8710a, #bf360c)',
  past_papers: 'linear-gradient(135deg, #7b1fa2, #4a148c)',
  recorded_sessions: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
  other: 'linear-gradient(135deg, #546e7a, #263238)',
};

const categoryLabels = {
  study_material: 'Study Material',
  project_template: 'Template',
  notes: 'Notes',
  past_papers: 'Past Papers',
  recorded_sessions: 'Recording',
  other: 'Other',
};

const accessConfig = {
  public: { label: 'Public', bg: 'rgba(76,175,80,0.15)', color: '#4caf50', icon: '🌐' },
  members: { label: 'Members', bg: 'rgba(33,150,243,0.15)', color: '#2196f3', icon: '🔵' },
  attendees: { label: 'Attendees', bg: 'rgba(255,152,0,0.15)', color: '#ff9800', icon: '🎟️' },
};

function getFileEmoji(fileType) {
  if (!fileType) return '📄';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('video')) return '🎬';
  if (fileType.includes('text') || fileType.includes('markdown')) return '📝';
  if (fileType.includes('json') || fileType.includes('javascript') || fileType.includes('python'))
    return '💻';
  return '📄';
}

export default function ResourceCard({
  resource,
  onVote,
  onDownload,
  votedByUser,
  bookmarked,
  onBookmark,
}) {
  const gradient = categoryGradients[resource.category] || categoryGradients.other;
  const label = categoryLabels[resource.category] || 'Resource';
  const fileEmoji = getFileEmoji(resource.fileType);
  const access = accessConfig[resource.accessLevel] || accessConfig.public;

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload?.(resource.id);
    if (resource.fileUrl && resource.fileUrl !== '#' && isSafeUrl(resource.fileUrl)) {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '18px 20px 14px',
          background: gradient,
          color: '#fff',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{fileEmoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              opacity: 0.85,
              marginBottom: '4px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
            title={resource.title}
          >
            {resource.title}
          </div>
        </div>

        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.(resource.id);
          }}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 7px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            lineHeight: 1,
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          {bookmarked ? '🔖' : '📌'}
        </button>
      </div>

      {/* Card Body */}
      <div
        style={{
          padding: '12px 20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {resource.description && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--t2)',
              lineHeight: 1.5,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {resource.description}
          </p>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(resource.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'var(--c1a, rgba(242,92,102,0.08))',
                color: 'var(--t2)',
                border: '1px solid var(--border)',
              }}
            >
              {tag}
            </span>
          ))}
          {(resource.tags || []).length > 3 && (
            <span style={{ fontSize: '0.68rem', color: 'var(--t3)', alignSelf: 'center' }}>
              +{resource.tags.length - 3}
            </span>
          )}
        </div>

        {/* Difficulty + Access Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {resource.difficultyLevel && (
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--t3)',
                textTransform: 'capitalize',
                background: 'var(--bg2, #0e121e)',
                padding: '2px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              {resource.difficultyLevel}
            </span>
          )}
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '8px',
              background: access.bg,
              color: access.color,
              fontWeight: 600,
            }}
          >
            {access.icon} {access.label}
          </span>
        </div>

        {/* Linked event */}
        {resource.eventTitle && (
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--t3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>📅</span>
            <span style={{ color: 'var(--c1)', fontWeight: 500 }}>{resource.eventTitle}</span>
          </div>
        )}

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.73rem',
            color: 'var(--t3)',
            marginTop: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span title="Downloads">⬇ {resource.downloads}</span>
            <span
              title={votedByUser ? 'Remove vote' : 'Upvote'}
              onClick={(e) => {
                e.stopPropagation();
                onVote?.(resource.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: onVote ? 'pointer' : 'default',
                color: votedByUser ? 'var(--c1)' : 'var(--t3)',
                transition: 'color 0.15s',
                userSelect: 'none',
              }}
            >
              <span>{votedByUser ? '👍' : '👍'}</span>
              <span>{resource.votes?.length || 0}</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{formatFileSize(resource.fileSize)}</span>
            <span>·</span>
            <span>👤 {resource.uploadedBy}</span>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div style={{ padding: '0 20px 16px' }}>
        <button
          onClick={handleDownloadClick}
          style={{
            width: '100%',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--accent, #CC1111)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {resource.fileType?.includes('video')
            ? '▶ Watch Recording'
            : resource.fileUrl?.includes('github')
              ? '⬡ View on GitHub'
              : '⬇ Download Resource'}
        </button>
      </div>
    </div>
  );
}
