import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const getApiBase = () => {
  return import.meta.env.VITE_API_BASE || 'http://localhost:4000';
};

export default function TeamChat({ teamId, user }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = io(getApiBase(), {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('team:join', teamId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('team:history', (history) => {
      setMessages(history);
    });

    socket.on('team:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socketRef.current) return;

    socketRef.current.emit('team:message', {
      teamId,
      content: inputValue,
      user,
    });
    setInputValue('');
  };

  return (
    <div
      className="team-chat-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '400px',
        background: 'var(--bg-card, rgba(255,255,255,0.03))',
        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <div
        className="team-chat-header"
        style={{
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Team Chat</h3>
        <span style={{ fontSize: '0.8rem', color: isConnected ? '#4ade80' : '#f87171' }}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </span>
      </div>

      <div
        className="team-chat-messages"
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', margin: 'auto' }}>
            No messages yet. Say hi!
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user?.id === user?.id;
            return (
              <div
                key={msg.id || idx}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#888',
                    marginBottom: '2px',
                    marginLeft: '4px',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.user?.name || 'Anonymous'}
                </span>
                <div
                  style={{
                    background: isMe ? 'var(--c1, #cc1111)' : 'rgba(255,255,255,0.1)',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    borderBottomRightRadius: isMe ? '4px' : '12px',
                    borderBottomLeftRadius: isMe ? '12px' : '4px',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          padding: '12px',
          gap: '8px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.1)',
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--c1, #cc1111)',
            color: '#fff',
            border: 'none',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            opacity: inputValue.trim() ? 1 : 0.6,
            fontWeight: '600',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
