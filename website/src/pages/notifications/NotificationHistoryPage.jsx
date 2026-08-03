import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { NotificationSkeleton } from '../../components/ui/skeleton/NotificationSkeleton';

const TYPE_ICONS = {
  message: '💬',
  connection: '🔗',
  mention: '@',
  system: '🔔',
};

function groupNotificationsForDisplay(items) {
  const grouped = [];
  const bucketIndex = new Map();

  for (const item of items) {
    if (item && Array.isArray(item.notifications)) {
      grouped.push({
        ...item,
        sortAt: item.notifications.reduce(
          (latest, note) => Math.max(latest, new Date(note.createdAt || 0).getTime()),
          0
        ),
      });
      continue;
    }

    if (!item) continue;

    const key =
      item.groupType && item.groupKey
        ? `${item.groupType}:${item.groupKey}`
        : item.eventId
          ? `event:${item.eventId}`
          : item.sender
            ? `sender:${item.sender}`
            : item.type
              ? `type:${item.type}`
              : `notification:${item.id}`;

    if (!bucketIndex.has(key)) {
      const createdAt = new Date(item.createdAt || 0).getTime();
      const groupTitle =
        item.groupType === 'event'
          ? 'Event Updates'
          : item.groupType === 'sender'
            ? `Messages from ${item.sender || 'Unknown'}`
            : item.groupType === 'type'
              ? `${item.type} updates`
              : item.sender
                ? `Messages from ${item.sender}`
                : item.eventId
                  ? 'Event Updates'
                  : `${item.type || 'Notification'} updates`;

      const group = {
        id: key,
        title: groupTitle,
        summaryCount: 0,
        notifications: [],
        sortAt: createdAt,
      };
      bucketIndex.set(key, group);
      grouped.push(group);
    }

    const group = bucketIndex.get(key);
    group.summaryCount += 1;
    group.notifications.push(item);
    group.sortAt = Math.max(group.sortAt, new Date(item.createdAt || 0).getTime());
  }

  return grouped.sort((a, b) => (b.sortAt || 0) - (a.sortAt || 0));
}

export default function NotificationHistoryPage({ userId }) {
  const { user: authUser } = useStudentAuth();
  const effectiveUserId = userId ?? authUser?.sub ?? authUser?.id;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | mentions | priority
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const limit = 50;

  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!effectiveUserId) return;
      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const data = await apiClient(
          `/api/notifications?userId=${effectiveUserId}&offset=${currentOffset}&limit=${limit}`
        );
        const list = data.notifications || [];
        if (reset) {
          setNotifications(list);
        } else {
          setNotifications((prev) => [...prev, ...list]);
        }
        setHasMore(list.length >= limit);
        if (!reset) setOffset((prev) => prev + list.length);
      } catch {
        // ignore
      }
      setLoading(false);
    },
    [effectiveUserId, offset]
  );

  useEffect(() => {
    setOffset(0);
    fetchNotifications(true);
  }, [effectiveUserId]);

  const markRead = useCallback(
    async (id) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      try {
        await apiClient('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, userId: effectiveUserId }),
        });
        socketEmit('notifications:updated', { userId: effectiveUserId, notificationId: id });
      } catch {
        /* ignore */
      }
    },
    [effectiveUserId]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiClient('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: effectiveUserId }),
      });
      socketEmit('notifications:updated', { userId: effectiveUserId, allRead: true });
    } catch {
      /* ignore */
    }
  }, [effectiveUserId]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setHasMore(false);
    try {
      await apiClient(`/api/notifications?userId=${effectiveUserId}`, { method: 'DELETE' });
      socketEmit('notifications:updated', { userId: effectiveUserId, cleared: true });
    } catch {
      /* ignore */
    }
  }, [effectiveUserId]);

  const filteredList = (() => {
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    if (filter === 'mentions') {
      // Best-effort: mentions are usually represented with type='mention' and/or title/message containing '@'
      return notifications.filter(
        (n) => n.type === 'mention' || /@/g.test(n.title || '') || /@/g.test(n.message || '')
      );
    }
    return notifications;
  })();

  const displayList = useMemo(() => groupNotificationsForDisplay(filteredList), [filteredList]);

  const renderItem = (n) => (
    <div
      key={n.id}
      onClick={() => {
        if (!n.isRead) markRead(n.id);
        if (n.link) navigate(n.link);
      }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        cursor: 'pointer',
        background: n.isRead ? 'transparent' : 'rgba(204,17,17,0.06)',
        border: '1px solid',
        borderColor: n.isRead ? 'var(--border)' : 'rgba(204,17,17,0.15)',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: '1.3rem' }}>{TYPE_ICONS[n.type] || '🔔'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: n.isRead ? 400 : 600, color: 'var(--t1)' }}>{n.title}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--t2)', marginTop: '2px' }}>{n.message}</div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--t2)',
            marginTop: '4px',
            opacity: 0.6,
          }}
        >
          {formatRelativeTime(n.createdAt)}
        </div>
      </div>
      {!n.isRead && (
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--c1)',
            flexShrink: 0,
            marginTop: '6px',
          }}
        />
      )}
    </div>
  );

  const ExpandableGroup = ({ group }) => {
    const [open, setOpen] = useState(false);
    const groupTitle = group.title || 'Notifications';

    // If server sent notifications array, show unread indicator
    const unreadCount = Array.isArray(group.notifications)
      ? group.notifications.filter((n) => !n.isRead).length
      : 0;

    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.9rem 1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--t1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700 }}>
              {groupTitle}{' '}
              <span style={{ fontWeight: 600, color: 'var(--t2)' }}>
                ({group.summaryCount ?? group.notifications?.length ?? 0})
              </span>
            </div>
            {unreadCount > 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--c1, #cc1111)' }}>
                {unreadCount} unread
              </div>
            )}
          </div>
          <div style={{ color: 'var(--t2)' }}>{open ? '▾' : '▸'}</div>
        </button>

        {open && Array.isArray(group.notifications) && (
          <div style={{ padding: '0.5rem 0.5rem 0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {group.notifications.map((n) => (
                <div key={n.id}>{renderItem(n)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ margin: 0, color: 'var(--t1)', fontSize: '1.5rem' }}>Notifications</h1>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={markAllRead}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--t1)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Mark All Read
          </button>
          <button
            onClick={clearAll}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--c1, #cc1111)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'mentions', label: 'Mentions' },
          { key: 'priority', label: 'Priority' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: filter === t.key ? 'rgba(204,17,17,0.10)' : 'transparent',
              color: 'var(--t1)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notifications..."
          style={{
            width: '100%',
            maxWidth: '720px',
            padding: '0.75rem 0.9rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--t1)',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchNotifications(true);
          }}
        />
      </div>

      {filteredList.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--t2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <p>No notifications yet</p>
        </div>
      )}

      {loading && filteredList.length === 0 ? (
        <NotificationSkeleton count={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {displayList.map((n) => (
            <div key={n.id || n.groupKey || n.groupType}>
              {n.notifications && Array.isArray(n.notifications) ? (
                <ExpandableGroup group={n} />
              ) : (
                renderItem(n)
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => fetchNotifications(false)}
            disabled={loading}
            style={{
              padding: '0.6rem 2rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--t1)',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
