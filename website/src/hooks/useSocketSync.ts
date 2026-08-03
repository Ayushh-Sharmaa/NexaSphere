import { useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { useSocketEvent } from './useSocketEvent';
import { useWorkspaceStore } from '../store/workspaceStore';

import type { UserInfo } from '../store/workspaceStore';

// ── Socket event payload types ────────────────────────────────────────
interface DocumentChangePayload {
  content: string;
}
interface UserJoinedPayload {
  socketId: string;
  user: UserInfo;
}
interface UserLeftPayload {
  socketId: string;
}
interface CursorMovedPayload {
  socketId: string;
  cursor: { x: number; y: number };
}
interface TypingPayload {
  socketId: string;
}

export function useSocketSync(roomId: string, user: UserInfo) {
  const { socket, isConnected } = useSocketContext();
  const setDocumentContent = useWorkspaceStore((state) => state.setDocumentContent);
  const setDocumentVersion = useWorkspaceStore((state) => state.setDocumentVersion);
  const setStatus = useWorkspaceStore((state) => state.setStatus);
  const addUser = useWorkspaceStore((state) => state.addUser);
  const removeUser = useWorkspaceStore((state) => state.removeUser);
  const updateUserCursor = useWorkspaceStore((state) => state.updateUserCursor);
  const updateUserTyping = useWorkspaceStore((state) => state.updateUserTyping);

  // Manage connection status UI
  useEffect(() => {
    if (isConnected) {
      setStatus('Connected');
      socket?.emit('join_room', roomId, user);
    } else {
      setStatus('Disconnected');
    }

    return () => {
      if (isConnected) {
        socket?.emit('leave_room', roomId);
      }
    };
  }, [isConnected, roomId, socket, setStatus, user]);

  useSocketEvent('connect_error', () => {
    setStatus('Reconnecting...');
  });

  // Sync events
  useSocketEvent<[{ content: string; version?: number }]>('document_state', (payload) => {
    setDocumentContent(payload.content);
    if (payload.version !== undefined) {
      setDocumentVersion(payload.version);
    }
  });

  useSocketEvent<[DocumentChangePayload]>('document_change', (payload) => {
    setDocumentContent(payload.content);
  });

  useSocketEvent<[UserJoinedPayload]>('user_joined', (payload) => {
    addUser(payload.socketId, payload.user);
  });

  useSocketEvent<[UserLeftPayload]>('user_left', (payload) => {
    removeUser(payload.socketId);
  });

  useSocketEvent<[CursorMovedPayload]>('cursor_moved', (payload) => {
    updateUserCursor(payload.socketId, payload.cursor);
  });

  useSocketEvent<[TypingPayload]>('typing_start', (payload) => {
    updateUserTyping(payload.socketId, true);
  });

  useSocketEvent<[TypingPayload]>('typing_stop', (payload) => {
    updateUserTyping(payload.socketId, false);
  });

  // Debounced/Throttled emitters
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCursorEmitRef = useRef<number>(0);

  const emitDocumentChange = (content: string) => {
    if (!socket) return;
    const currentVersion = useWorkspaceStore.getState().version;
    setStatus('Syncing changes...');
    socket.emit('document_change', { roomId, content, version: currentVersion });
    setTimeout(() => {
      if (useWorkspaceStore.getState().status === 'Syncing changes...') {
        setStatus('Connected');
      }
    }, 500);
  };

  const emitCursorMove = (cursor: { x: number; y: number }) => {
    if (!socket) return;
    const now = Date.now();
    // Throttle cursor movement to 50ms (20fps)
    if (now - lastCursorEmitRef.current > 50) {
      socket.emit('cursor_moved', { roomId, cursor });
      lastCursorEmitRef.current = now;
    }
  };

  const emitTyping = () => {
    if (!socket) return;
    socket.emit('typing_start', { roomId, user: { name: user.name } });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId });
    }, 1000);
  };

  return {
    emitDocumentChange,
    emitCursorMove,
    emitTyping,
  };
}
