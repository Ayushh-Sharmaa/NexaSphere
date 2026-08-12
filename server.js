import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer((req, res) => {
  // 1. Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // 2. Enforce Strict Content Security Policy (CSP)
  // Whitelisting 'self' and allowing connections for WebSockets/APIs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // Often needed for React/Vite dev environments
    "img-src 'self' data:",
    "connect-src 'self' ws: wss: http: https:", // Explicitly allowing external API and WebSocket connections
    "frame-ancestors 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // Send a basic response for standard HTTP pings
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('NexaSphere API Gateway & WebSocket Server is secure and running.');
  }
});
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// Fake live data generators
let registrations = 142;
let attendees = 87;
let checkIns = 63;

const eventData = {
  'Tech Summit 2024': { registrations: 450, attendees: 312, checkIns: 289 },
  'Design Workshop': { registrations: 120, attendees: 98, checkIns: 91 },
  'AI Conference': { registrations: 380, attendees: 241, checkIns: 198 },
  'Startup Meetup': { registrations: 200, attendees: 156, checkIns: 143 },
};

const trendHistory = Array.from({ length: 10 }, (_, i) => ({
  time: `${10 - i}m ago`,
  registrations: Math.floor(Math.random() * 50) + 100,
  checkIns: Math.floor(Math.random() * 40) + 60,
})).reverse();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('initial_data', {
    registrations,
    attendees,
    checkIns,
    eventData,
    trendHistory,
  });
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Push live updates every 2 seconds
setInterval(() => {
  registrations += Math.floor(Math.random() * 3);
  attendees += Math.floor(Math.random() * 2);
  checkIns += Math.floor(Math.random() * 2);

  trendHistory.push({
    time: 'now',
    registrations,
    checkIns,
  });
  if (trendHistory.length > 15) trendHistory.shift();

  io.emit('live_update', {
    registrations,
    attendees,
    checkIns,
    trendHistory,
  });
}, 2000);

httpServer.listen(4000, () => {
  console.log('✅ WebSocket server running on http://localhost:4000');
});
