import { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient.js";
import socketClient from "../utils/socketClient";
import {
  buildUrl,
  getApiBase,
  getSocketServerUrl,
} from "../utils/runtimeConfig";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Initialize socket and listen to real-time events
  useEffect(() => {
    let isMounted = true;

    // Fetch persisted notifications from server (if available)
    (async () => {
      try {
        const res = await fetch(buildUrl(getApiBase(), "/api/notifications"));
        if (res.ok) {
          const json = await res.json();
          if (isMounted && Array.isArray(json.notifications))
            setNotifications(json.notifications);
        }
      } catch (err) {
        // ignore fetch errors — fallback to empty list
        console.warn("Failed to fetch notifications", err.message);
      }
    })();

    const base = getSocketServerUrl();
    const socket = socketClient.initializeSocket(base);
    if (!socket) {
      return undefined;
    }

    // Identify user if logged in (for personalized notifications)
    const storedUser = localStorage.getItem("ns_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.id || user.userId) {
          socketClient.identifyUser(user.id || user.userId, user.email);
          // Join authenticated user-specific channel
          socketClient.joinRoom(`user-${user.id || user.userId}`);
        }
      } catch (e) {
        console.error("Error parsing stored user info", e);
      }
    }

    // Join general notification and announcement channels
    socketClient.joinRoom("notifications-room");
    socketClient.joinRoom("global-announcements");

    // Setup real-time event handlers mapping to the notification feed
    const handleRegistration = (data) => {
      setNotifications((prev) => {
        // Prevent duplicate by checking if we recently added a similar notification
        // Note: data.id would be better if server provides it
        return [
          {
            id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            message: data.eventName
              ? `You are registered for "${data.eventName}"`
              : "Your registration has been successfully confirmed.",
            type: "connection",
            title: "Registration Confirmed! 🎉",
            message: data.eventName
              ? `You are registered for "${data.eventName}"`
              : "Your registration has been successfully confirmed.",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    const handleWaitlist = (data) => {
      setNotifications((prev) => [
        {
          id: `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: "mention",
          title: "Waitlist Promotion! 🚀",
          message: data.eventName
            ? `Great news! You have been promoted for "${data.eventName}"`
            : "You have been promoted from the waitlist.",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    const handleReminder = (data) => {
      setNotifications((prev) => [
        {
          id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: "system",
          title: "Upcoming Event Reminder ⏰",
          message: data.eventName
            ? `"${data.eventName}" is starting soon! Don't miss it.`
            : "An event is starting shortly.",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    const handleAttendance = (data) => {
      setNotifications((prev) => [
        {
          id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: "system",
          title: "Attendance Confirmed! Check-in ✅",
          message: `Your check-in is complete! You earned ${data.points || 50} points.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    // Note: The backend seems to emit 'registration-confirmed' but previously it mapped to 'registrationConfirmed'
    // Let's use the actual events emitted by socketClient.js earlier, wait, I removed the mapping, so I must use the exact names from backend!
    // The previous setupEventListeners mapped:
    // 'registration-confirmed' -> 'registrationConfirmed'
    // 'waitlist-promotion' -> 'waitlistPromotion'
    // 'event-reminder' -> 'eventReminder'
    // 'attendance-marked' -> 'attendanceMarked'

    // Register active listeners using the actual backend event names
    socketClient.on("registration-confirmed", handleRegistration);
    socketClient.on("waitlist-promotion", handleWaitlist);
    socketClient.on("event-reminder", handleReminder);
    socketClient.on("attendance-marked", handleAttendance);

    return () => {
      isMounted = false;
      socketClient.off("registration-confirmed", handleRegistration);
      socketClient.off("waitlist-promotion", handleWaitlist);
      socketClient.off("event-reminder", handleReminder);
      socketClient.off("attendance-marked", handleAttendance);

      const storedUser = localStorage.getItem("ns_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.id || user.userId) {
            socketClient.leaveRoom(`user-${user.id || user.userId}`);
          }
        } catch (e) {}
      }

      socketClient.leaveRoom("notifications-room");
      socketClient.leaveRoom("global-announcements");
    };
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), "/api/notifications/mark-read"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch (e) {}
    })();
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    (async () => {
      try {
        await fetch(
          buildUrl(getApiBase(), "/api/notifications/mark-all-read"),
          {
            method: "POST",
          }
        );
      } catch (e) {}
    })();
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    (async () => {
      try {
        await fetch(buildUrl(getApiBase(), "/api/notifications"), {
          method: "DELETE",
        });
      } catch (e) {}
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
    markAllAsRead,
    clearAll,
  };
}
