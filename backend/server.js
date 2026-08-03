// Must be required first to instrument properly
require('./tracing');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env first
dotenv.config();

// Connect Database
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dynamicRateLimiter = require('./middleware/rateLimiter');
app.use(dynamicRateLimiter);

// ─── Routes ───────────────────────────────────────────────
app.use('/api/interview',  require('./routes/interview'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/feedback',   require('./routes/feedback'));
app.use('/api/audit',      require('./routes/audit'));

// ─── Observability & Health ───────────────────────────────
const { router: healthRouter, httpRequestDurationMicroseconds } = require('./routes/health');
app.use('/', healthRouter);

// Middleware to track request duration for Prometheus
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, code: res.statusCode });
  });
  next();
});

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});

// Initialize WebRTC signaling
require('./socket/webrtcSignaling')(io);

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});