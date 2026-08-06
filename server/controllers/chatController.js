import { broadcastEvent } from '../config/socket.js';
// We use an in-memory array as a fallback in case DB isn't available, but we can try to use Prisma.
// The issue requests message history, so we'll store them.
const messages = [];

export function setupChatSocketHandlers(socket, io) {
  // Client joins a team room
  socket.on('team:join', (teamId) => {
    socket.join(`team:${teamId}`);
    // Send message history to the joined client
    const history = messages.filter(m => m.teamId === teamId);
    socket.emit('team:history', history);
  });

  // Client sends a message
  socket.on('team:message', (data) => {
    const { teamId, content, user } = data;
    if (!teamId || !content) return;
    
    const message = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      teamId,
      content,
      user: user || { id: 'anonymous', name: 'Anonymous' },
      createdAt: new Date().toISOString()
    };
    
    messages.push(message);
    if (messages.length > 1000) {
      messages.shift(); // keep last 1000 messages in memory
    }

    // Broadcast to everyone in the room
    io.to(`team:${teamId}`).emit('team:message', message);
  });
}
