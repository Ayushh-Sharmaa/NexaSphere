import { useState, useEffect, useCallback, useContext } from 'react';
import socketClient from '../utils/socketClient';
import { buildUrl, getApiBase, getSocketServerUrl } from '../utils/runtimeConfig';
import { StudentAuthContext } from '../context/StudentAuthContext';
import prefsService from '../services/notifications/preferences';
import analytics from './analytics/useNotificationAnalytics';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const authContext = useContext(StudentAuthContext);
  const user = authContext?.user;
  const userId = user?.sub || user?.id || user?.userId;
  const userEmail = user?.email;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Initialize socket and listen to real-time events
  useEffect(() => {
    let isMounted = true;
    let prefMap = {};

    async function loadPrefs() {
      try {
        const list = await prefsService.fetchPreferences(userId || 'global');
        const map = {};
        for (const p of list || []) map[p.category] = p;
        prefMap = map;
      } catch (e) {
        prefMap = {};
      }
    }

    loadPrefs();

    // Fetch persisted notifications from server (if available)
    (async () => {
      try {
        let resolvedUserId = userId;
        if (!resolvedUserId) {
          let storedUser = null;
          try {
            storedUser = localStorage.getItem('ns_user');
          } catch {
            // Storage unavailable — skip stored user lookup.
          }
          if (storedUser) {
            try {
              const u = JSON.parse(storedUser);
              resolvedUserId = u?.id || u?.userId;
            } catch (e) {
              if (import.meta.env.DEV) {
                console.error('[useNotifications] Error parsing stored user info:', e.message);
              }
            }
          }
        }

        const fetchUrls = [buildUrl(getApiBase(), '/api/notifications')];
        if (resolvedUserId) {
          fetchUrls.push(buildUrl(getApiBase(), `/api/notifications?userId=${resolvedUserId}`));
        }

        const responses = await Promise.allSettled(
          fetchUrls.map(async (url) => {
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) {
              const error = new Error(`Failed to load notifications (${res.status})`);
              error.status = res.status;
              error.url = url;
              throw error;
            }
            return res.json();
          })
        );

        if (isMounted) {
          const allNotifications = responses
            .filter((r) => r.status === 'fulfilled')
            .flatMap((r) => r.value.notifications || []);
          // De-duplicate by unique id
          const seen = new Set();
          const uniqueNotifications = [];
          for (const item of allNotifications) {
            if (item && item.id && !seen.has(item.id)) {
              seen.add(item.id);
              uniqueNotifications.push(item);
            }
          }
          // Sort by creation date (newest first)
          uniqueNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNotifications(uniqueNotifications);
          if (import.meta.env.DEV && responses.some((r) => r.status === 'rejected')) {
            console.warn(
              '[useNotifications] One or more notification fetches failed; using partial results.'
            );
          }
        }
      } catch (err) {
        // ignore fetch errors — fallback to empty list
        console.warn('Failed to fetch notifications', err.message);
      }
    })();

    const base = getSocketServerUrl();
    const socket = socketClient.initializeSocket(base);
    if (!socket) {
      return undefined;
    }

    // Personalised socket identification (user-specific notification channel)
    if (userId) {
      socketClient.identifyUser(userId, userEmail);
      socketClient.joinRoom(`user-${userId}`);
      socketClient.joinRoom(`user-${String(userId).toLowerCase()}`);
      if (userEmail) {
        socketClient.joinRoom(`user-${String(userEmail).toLowerCase()}`);
      }
    }

    // Join general notification and announcement channels
    socketClient.joinRoom('notifications-room');
    socketClient.joinRoom('global-announcements');

    // Setup real-time event handlers mapping to the notification feed
    const handleRegistration = (data) => {
      // Build notification object
      const note = {
        id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'registration_confirmations',
        title: 'Registration Confirmed! 🎉',
        message: data.eventName
          ? `You are registered for "${data.eventName}"`
          : 'Your registration has been successfully confirmed.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Check preferences: if push is disabled or quiet hours/DND active, suppress locally
      (async () => {
        try {
          const prefs = prefMap[note.type] || prefMap['global'] || {};
          const channelEnabled = prefs.push !== false;
          const dnd = (prefMap['global'] && prefMap['global'].dnd) || false;
          const withinQuiet = (() => {
            const qs =
              prefs.quiet_start || (prefMap['global'] && prefMap['global'].quiet_start) || null;
            const qe =
              prefs.quiet_end || (prefMap['global'] && prefMap['global'].quiet_end) || null;
            if (!qs || !qe) return false;
            const toMin = (t) => {
              const s = String(t).split(':');
              return parseInt(s[0], 10) * 60 + parseInt(s[1], 10);
            };
            const now = new Date();
            const m = now.getHours() * 60 + now.getMinutes();
            const sMin = toMin(qs);
            const eMin = toMin(qe);
            return sMin <= eMin ? m >= sMin && m < eMin : m >= sMin || m < eMin;
          })();

          if (!channelEnabled || dnd || withinQuiet) {
            // Do not show immediately; keep in queue for digest or ignore
            // Simple local queue in localStorage
            try {
              const key = 'ns_notification_digest_queue';
              const raw = localStorage.getItem(key);
              const arr = raw ? JSON.parse(raw) : [];
              arr.push({
                ...note,
                suppressedAt: new Date().toISOString(),
                suppressedReason: !channelEnabled ? 'channel' : dnd ? 'dnd' : 'quiet',
              });
              localStorage.setItem(key, JSON.stringify(arr));
            } catch (e) {
              setNotifications((prev) => [note, ...prev]);
              console.error('[useNotifications] Failed to persist suppressed notification:', e);
            }
            return;
          }

          // Otherwise add to feed
          setNotifications((prev) => [note, ...prev]);
        } catch (e) {
          setNotifications((prev) => [note, ...prev]);
        }
      })();
    };

    const handleWaitlist = (data) => {
      const note = {
        id: `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'announcements',
        title: 'Waitlist Promotion! 🚀',
        message: data.eventName
          ? `Great news! You have been promoted for "${data.eventName}"`
          : 'You have been promoted from the waitlist.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [note, ...prev]);
    };

    const handleReminder = (data) => {
      const note = {
        id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'event_reminders',
        title: 'Upcoming Event Reminder ⏰',
        message: data.eventName
          ? `"${data.eventName}" is starting soon! Don't miss it.`
          : 'An event is starting shortly.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [note, ...prev]);
    };

    const handleAttendance = (data) => {
      const note = {
        id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'messages',
        title: 'Attendance Confirmed! Check-in ✅',
        message: `Your check-in is complete! You earned ${data.points || 50} points.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [note, ...prev]);
    };

    const handleEventPublished = (data) => {
      const note = {
        id: `event-published-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'system',
        title: 'New Event Published! 📅',
        message: data.eventName
          ? `"${data.eventName}" is now open for registration!`
          : 'A new event has been published.',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: data.eventId ? `/events/${data.eventId}` : '/events',
      };
      setNotifications((prev) => [note, ...prev]);
    };

    const handleProjectApproved = (data) => {
      const note = {
        id: `project-approved-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'system',
        title: 'Project Approved! 🚀',
        message: data.projectName
          ? `Your project "${data.projectName}" has been approved and published.`
          : 'Your project has been approved.',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/projects',
      };
      setNotifications((prev) => [note, ...prev]);
    };
    const handleNewComment = (data) => {
      const note = {
        id: `new-comment-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'message',
        title: 'New Reply on Forum! 💬',
        message:
          data.authorName && data.threadTitle
            ? `${data.authorName} replied to "${data.threadTitle}"`
            : 'Someone replied to your thread.',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: data.threadId ? `/forum/thread/${data.threadId}` : '/forum',
      };
      setNotifications((prev) => [note, ...prev]);
    };

    // Note: The backend seems to emit 'registration-confirmed' but previously it mapped to 'registrationConfirmed'
    // Let's use the actual events emitted by socketClient.js earlier, wait, I removed the mapping, so I must use the exact names from backend!
    // The previous setupEventListeners mapped:
    // 'registration-confirmed' -> 'registrationConfirmed'
    // 'waitlist-promotion' -> 'waitlistPromotion'
    // 'event-reminder' -> 'eventReminder'
    // 'attendance-marked' -> 'attendanceMarked'

    // Register active listeners using the actual backend event names
    socketClient.on('registration-confirmed', handleRegistration);
    socketClient.on('waitlist-promotion', handleWaitlist);
    socketClient.on('event-reminder', handleReminder);
    socketClient.on('attendance-marked', handleAttendance);
    socketClient.on('event-published', handleEventPublished);
    socketClient.on('project-approved', handleProjectApproved);
    socketClient.on('new-comment', handleNewComment);

    return () => {
      isMounted = false;
      // Cleanup listeners passing handler references
      socketClient.off('registration-confirmed', handleRegistration);
      socketClient.off('waitlist-promotion', handleWaitlist);
      socketClient.off('event-reminder', handleReminder);
      socketClient.off('attendance-marked', handleAttendance);
      socketClient.off('event-published', handleEventPublished);
      socketClient.off('project-approved', handleProjectApproved);
      socketClient.off('new-comment', handleNewComment);

      if (userId) {
        socketClient.leaveRoom(`user-${userId}`);
      }
      socketClient.leaveRoom('notifications-room');
      socketClient.leaveRoom('global-announcements');

      // DO NOT disconnect the shared socket here
    };
  }, [userId, userEmail]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    // Persist
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), '/api/notifications/mark-read'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id }),
        });
        analytics.trackNotificationOpened({ id });
      } catch (e) {
        console.error('[useNotifications] Failed to mark as read:', e);
      }
    })();
  }, []);

  const trackAction = useCallback((id, action) => {
    analytics.trackNotificationAction({ id, action });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), '/api/notifications/mark-all-read'), {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      } catch (e) {
        console.error('[useNotifications] Failed to mark all as read:', e);
      }
    })();
  }, []);

  const markAsUnread = useCallback(
    (id) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      (async () => {
        try {
          await fetch(buildUrl(getApiBase(), '/api/notifications/mark-unread'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });
          trackAction(id, 'marked_unread');
        } catch (e) {
          console.error('[useNotifications] Failed to mark as unread:', e);
        }
      })();
    },
    [trackAction]
  );

  const deleteNotification = useCallback(
    (id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      (async () => {
        try {
          await fetch(buildUrl(getApiBase(), `/api/notifications/${id}`), {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          trackAction(id, 'deleted');
        } catch (e) {
          console.error('[useNotifications] Failed to delete notification:', e);
        }
      })();
    },
    [trackAction]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), '/api/notifications'), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch (e) {
        console.error('[useNotifications] Failed to clear notifications:', e);
      }
    })();
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    notifications,
    unreadCount,
    isOpen,
    togglePanel,
    closePanel,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    clearAll,
    deleteNotification,
    trackAction,
  };
}
