import { useState } from 'react';

const NotificationBell = () => {
  const [count, setCount] = useState(3);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
      onClick={() => setCount(0)}
    >
      <span style={{ fontSize: '1.5rem' }}>🔔</span>
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            fontSize: '0.7rem',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, Users, AtSign, Settings, X, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
const formatBadgeCount = (count) => (count > 99 ? '99+' : count);
const TYPE_CONFIG = {
  message: { icon: <MessageCircle size={16} />, color: 'var(--c1)', bg: 'rgba(204,17,17,0.15)' },
  connection: { icon: <Users size={16} />, color: '#9999ff', bg: 'rgba(90,90,255,0.15)' },
  mention: { icon: <AtSign size={16} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  system: { icon: <Settings size={16} />, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
};

function timeAgo(isoString) {
  if (!isoString) return 'just now';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'just now';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  MessageCircle,
  Users,
  AtSign,
  Settings,
  X,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

const TYPE_CONFIG = {
  message: {
    icon: <MessageCircle size={16} />,
    color: "var(--c1)",
    bg: "rgba(204,17,17,0.15)",
  },
  connection: {
    icon: <Users size={16} />,
    color: "#9999ff",
    bg: "rgba(90,90,255,0.15)",
  },
  mention: {
    icon: <AtSign size={16} />,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  system: {
    icon: <Settings size={16} />,
    color: "#34d399",
    bg: "rgba(52,211,153,0.15)",
  },
};

function timeAgo(isoString) {
  if (!isoString) return "just now";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "just now";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isOpen,
    togglePanel,
    closePanel,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const panelRef = useRef(null);
  const panelId = useId();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        closePanel();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, closePanel]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closePanel]);

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-block' }}>
      if (e.key === "Escape") closePanel();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closePanel]);

  return (
    <div
      ref={panelRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Bell Button */}
      <motion.button
        onClick={togglePanel}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        aria-label={`Notifications${unreadCount ? ` (${formatBadgeCount(unreadCount)} unread)` : ''}`}
        style={{
          position: "relative",
          background: isOpen
            ? "rgba(204,17,17,0.18)"
            : "rgba(255,255,255,0.12)",
          border: "1px solid",
          borderColor: isOpen
            ? "rgba(204,17,17,0.5)"
            : "rgba(255,255,255,0.18)",
          borderRadius: "12px",
          padding: "10px",
          cursor: "pointer",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s, border-color 0.2s",
          boxShadow: "0 0 10px rgba(255,255,255,0.08)",
        }}
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            position: 'relative',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            position: "relative",
          }}
        >
          🔔
        </motion.div>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: 'var(--c1)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid var(--bg)',
                position: "absolute",
                top: "-6px",
                right: "-6px",
                background: "var(--c1)",
                color: "#fff",
                fontSize: "0.65rem",
                fontWeight: 700,
                minWidth: "18px",
                height: "18px",
                borderRadius: "9px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                border: "2px solid var(--bg)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
              {formatBadgeCount(unreadCount)}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: "340px",
              background: "var(--bg)",
              border: "1px solid rgba(204,17,17,0.22)",
              borderRadius: "16px",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(204,17,17,0.08)",
              overflow: "hidden",
              zIndex: 9000,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--c1)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--t1)",
                  }}
                >
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: 'rgba(204,17,17,0.15)',
                      color: 'var(--c1)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '10px',
                      background: "rgba(204,17,17,0.15)",
                      color: "var(--c1)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "1px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {unreadCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      color: 'var(--t2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontFamily: 'inherit',
                      background: "rgba(255,255,255,0.07)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "5px 8px",
                      cursor: "pointer",
                      color: "var(--t2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.72rem",
                      fontFamily: "inherit",
                    }}
                  >
                    <CheckCheck size={13} /> All read
                  </motion.button>
                )}
                {notifications.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAll}
                    title="Clear all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      color: 'var(--t2)',
                      display: 'flex',
                      alignItems: 'center',
                      background: "rgba(255,255,255,0.07)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "5px 8px",
                      cursor: "pointer",
                      color: "var(--t2)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                )}
                <motion.button
                  aria-label="Interactive element"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closePanel}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    color: 'var(--t2)',
                    display: 'flex',
                    alignItems: 'center',
                    background: "rgba(255,255,255,0.07)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "5px 8px",
                    cursor: "pointer",
                    color: "var(--t2)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={13} />
                </motion.button>
              </div>
            </div>

            {/* Notification List */}
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '44px 20px',
                    textAlign: 'center',
                    color: 'var(--t2)',
                    padding: "44px 20px",
                    textAlign: "center",
                    color: "var(--t2)",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(204,17,17,0.3)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginBottom: '10px' }}
                    style={{ marginBottom: "10px" }}
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <div style={{ fontSize: "0.9rem" }}>No notifications yet</div>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                  return (
                    <motion.button
                      aria-label="Interactive element"
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      whileHover={{ background: "rgba(204,17,17,0.06)" }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: n.isRead ? 'none' : 'rgba(204,17,17,0.04)',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'background 0.15s',
                        width: "100%",
                        textAlign: "left",
                        background: n.isRead ? "none" : "rgba(204,17,17,0.04)",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        padding: "12px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: cfg.bg,
                          color: cfg.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: cfg.bg,
                          color: cfg.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        {cfg.icon}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: n.isRead ? 400 : 700,
                            fontSize: '0.88rem',
                            color: 'var(--t1)',
                            marginBottom: '2px',
                            fontSize: "0.88rem",
                            color: "var(--t1)",
                            marginBottom: "2px",
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--t2)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: "0.78rem",
                            color: "var(--t2)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.message}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--t2)',
                            marginTop: '4px',
                            fontSize: "0.7rem",
                            color: "var(--t2)",
                            marginTop: "4px",
                            opacity: 0.7,
                          }}
                        >
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!n.isRead && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--c1)',
                            flexShrink: 0,
                            marginTop: '6px',
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--c1)",
                            flexShrink: 0,
                            marginTop: "6px",
                          }}
                        />
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
