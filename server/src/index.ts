import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB, isDbConnected } from './config/db.js';
import { seedDemoData } from './seed.js';
import { startSimulator } from './simulator.js';
import {
  startDemoSync,
  stopDemoSync,
  getDemoServerHealthStatus,
  fetchDemoServerStatus,
} from './services/demoServerService.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import auditLogsRouter from './routes/auditLogs.js';
import threatsRouter from './routes/threats.js';
import serversRouter from './routes/servers.js';
import sessionsRouter from './routes/sessions.js';
import alertsRouter from './routes/alerts.js';
import activitiesRouter from './routes/activities.js';
import analyticsRouter from './routes/analytics.js';
import reportsRouter from './routes/reports.js';
import statusRouter from './routes/status.js';
import ingestRouter from './routes/ingest.js';
import searchRouter from './routes/search.js';
import intelligenceRouter from './routes/intelligence.js';
import demoRouter from './routes/demo.js';
import healthRouter from './routes/health.js';
import eventsRouter from './routes/events.js';
import incidentsRouter from './routes/incidents.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3001;
const VERSION = process.env.THREATX_VERSION || '1.0.0';

// Socket.IO Real-time Hub
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL || 'http://localhost:5173',
];

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev Socket.io handshake
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] SOC Client connected: ${socket.id}`);
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] SOC Client disconnected: ${socket.id} (${reason})`);
  });
});

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable default CSP in dev to allow Vite and local websockets
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration - Restricted to development origins with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Access denied for this origin.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// 3. Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate Limiting Middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts',
    message: 'Rate limit exceeded. Please try again after 15 minutes.',
  },
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Generous limit for live telemetry polling
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalApiLimiter);
app.use('/api/auth/login', authLimiter);

// 5. Health, Readiness, and Info Routes
app.use('/api/health', healthRouter);
app.use('/api/info', healthRouter);

// 6. Central REST API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/servers', serversRouter);
app.use('/api/threats', threatsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/status', statusRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/search', searchRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/demo', demoRouter);

// 7. Backward Compatibility Routes
app.use('/api/events', eventsRouter);
app.use('/api/agent', eventsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/dashboard', dashboardRouter);

// 8. Global Error Handler for safe production responses (no secrets or internals exposed)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Exception]', err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in the ThreatX core pipeline',
  });
});

// Initialize DB, Seed Data, Synchronization, and Server Listener
async function startServer() {
  console.log('[ThreatX] ========================================');
  console.log(`[ThreatX] Starting ThreatX SOC Platform v${VERSION}...`);
  console.log('[ThreatX] ========================================');

  // Validate MongoDB
  const dbConnected = await connectDB();
  console.log(`[ThreatX] MongoDB: ${dbConnected ? 'Connected' : 'Fallback in-memory active'}`);

  // Seed baseline data
  await seedDemoData();

  // Start internal simulators & telemetry sync
  startSimulator();
  startDemoSync(io);

  // Initial check on Demo Server
  const initialDemoStatus = await fetchDemoServerStatus();
  console.log(`[ThreatX] Demo Server: ${initialDemoStatus ? 'Connected (port 5001)' : 'Standby / Offline'}`);

  httpServer.listen(PORT, () => {
    console.log(`[ThreatX] API: http://localhost:${PORT}`);
    console.log(`[ThreatX] Socket.IO: Active & listening on port ${PORT}`);
    console.log(`[ThreatX] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[ThreatX] Platform ready for SOC operations.`);
    console.log('[ThreatX] ========================================');
  });
}

// Graceful Shutdown Handling
let isShuttingDown = false;
async function handleGracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[ThreatX] Received ${signal}. Initiating graceful shutdown...`);

  try {
    // 1. Stop background sync and simulation loops
    stopDemoSync();

    // 2. Close Socket.IO real-time hub
    io.close();
    console.log('[ThreatX] Socket.IO bus closed.');

    // 3. Stop accepting new HTTP requests
    httpServer.close(async () => {
      console.log('[ThreatX] HTTP server listener closed.');

      // 4. Close MongoDB connection
      if (isDbConnected()) {
        await mongoose.connection.close();
        console.log('[ThreatX] MongoDB connection terminated cleanly.');
      }

      console.log('[ThreatX] Graceful shutdown complete. Exiting.');
      process.exit(0);
    });

    // Timeout safety fallback
    setTimeout(() => {
      console.warn('[ThreatX] Forced exit after shutdown timeout.');
      process.exit(0);
    }, 4000);
  } catch (err: any) {
    console.error('[ThreatX Shutdown Error]', err.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();

export { app, httpServer };
export default app;
