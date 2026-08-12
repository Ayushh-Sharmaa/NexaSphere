import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useSocketSync } from '../../hooks/useSocketSync';
import { useCollaborativeDoc } from '../../hooks/useCollaborativeDoc';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { Users, Wifi, WifiOff, RefreshCw, CheckCircle2, ChevronLeft } from 'lucide-react';
import './WorkspacePage.css';

interface WorkspacePageProps {
  roomId: string;
  onBack: () => void;
}

/** Derive a stable anonymous identity persisted for the browser session.
 *  Falls back to a new random identity if sessionStorage is unavailable.
 */
function getOrCreateAnonUser() {
  const STORAGE_KEY = 'ns_workspace_anon_user';
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Guard against malformed stored objects (e.g. missing `name` from a
      // future schema change) so we don't lose the user's existing color/id
      // and silently regenerate a brand new identity for a recoverable case.
      const safeName =
        typeof parsed?.name === 'string' && parsed.name.length > 0
          ? parsed.name
          : `User-${Math.floor(Math.random() * 9000) + 1000}`;
      return {
        ...parsed,
        name: safeName,
        initials: safeName.substring(0, 2).toUpperCase(),
      };
    }
  } catch {
    // sessionStorage unavailable (private browsing), or stored value is not
    // valid JSON — fall through to create
  }
  const secureRand = new Uint32Array(2);
  window.crypto.getRandomValues(secureRand);
  const id = (secureRand[0] % 9000) + 1000;
  const hue = secureRand[1] % 360;
  const name = `User-${id}`;
  const user = {
    name,
    color: `hsl(${hue}, 70%, 50%)`,
    initials: name.substring(0, 2).toUpperCase(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore write failure
  }
  return user;
}

export default function WorkspacePage({ roomId, onBack }: WorkspacePageProps) {
  // Stable anonymous identity — persisted for the session so hot reloads
  // and re-mounts do not generate a new user name and color each time.
  const { user: authUser } = useStudentAuth();
  const [anonUser] = useState(getOrCreateAnonUser);

  const user = useMemo(() => {
    let u;
    if (authUser) {
      u = {
        id: authUser.id,
        name: authUser.name,
        color: '#E63946',
        avatarUrl: authUser.avatar_url,
      };
    } else {
      u = anonUser;
    }
    return {
      ...u,
      initials: u.name.substring(0, 2).toUpperCase(),
    };
  }, [authUser, anonUser]);

  const { updateDocContent, updateLocalCursor, updateLocalTyping } = useCollaborativeDoc(
    roomId,
    user
  );
  const { documentContent, users, status } = useWorkspaceStore();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateDocContent(val);
    updateLocalTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateLocalTyping(false);
    }, 1000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    updateLocalCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    updateLocalCursor(null);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Connected':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'Disconnected':
        return <WifiOff size={16} className="text-red-500" />;
      case 'Reconnecting...':
        return <RefreshCw size={16} className="text-yellow-500 animate-spin" />;
      case 'Syncing changes...':
        return <Wifi size={16} className="text-blue-500 animate-pulse" />;
      default:
        return <Wifi size={16} />;
    }
  };

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <div className="workspace-header-left">
          <button aria-label="Interactive element" onClick={onBack} className="workspace-back-btn">
            <ChevronLeft size={20} /> Back
          </button>
          <h2>Room: {roomId}</h2>
          <div className="workspace-status">
            {getStatusIcon()}
            <span className="status-text">{status}</span>
          </div>
        </div>
        <div className="workspace-presence">
          <Users size={20} className="presence-icon" />
          <div className="avatar-group">
            {Object.values(users).map((u) => (
              <div
                key={u.socketId}
                className={`avatar ${u.isTyping ? 'typing' : ''}`}
                style={{ backgroundColor: u.user?.color || '#555' }}
                title={`${u.user?.name || 'Anonymous'} ${u.isTyping ? '(typing...)' : ''}`}
              >
                {u.user?.initials || '?'}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="workspace-editor-area"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {Object.values(users).map((u) => {
          if (!u.cursor || u.socketId === 'local') return null; // Don't show local cursor as a fake one
          return (
            <div
              key={`cursor-${u.socketId}`}
              className="remote-cursor"
              style={{
                transform: `translate(${u.cursor.x}px, ${u.cursor.y}px)`,
                backgroundColor: u.user?.color || '#ff0000',
              }}
            >
              <div className="cursor-label" style={{ backgroundColor: u.user?.color || '#ff0000' }}>
                {u.user?.name || 'Unknown'}
              </div>
            </div>
          );
        })}

        <textarea
          ref={editorRef}
          className="workspace-textarea"
          value={documentContent}
          onChange={handleTextChange}
          placeholder="Start typing collaboratively..."
        />
      </div>
    </div>
  );
}
