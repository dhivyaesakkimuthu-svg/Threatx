import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { auditLogger } from './middleware/auditLog.js';
import { initSocketIO, getIO } from './socket.js';
import { connectMongo } from './db/mongo.js';
import { initDb } from './db/store.js';
import authRouter from './routes/auth.js';
import serversRouter from './routes/servers.js';
import eventsRouter from './routes/events.js';
import incidentsRouter from './routes/incidents.js';
import dashboardRouter from './routes/dashboard.js';
import agentRouter from './routes/agent.js';
import assistantRouter from './routes/assistant.js';
import { seedDemoData } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;
const httpServer = http.createServer(app);

// Attach Socket.IO to HTTP server
const io = initSocketIO(httpServer);
export { io, getIO };

app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(auditLogger);

// Rate limiting: 100 req/15min for all /api/*, 1000 req/15min for /api/events/ingest
const ingestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many ingest requests from this IP, please try again after 15 minutes' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  skip: (req) => req.originalUrl.startsWith('/api/events/ingest'),
});

app.use('/api/events/ingest', ingestLimiter);
app.use('/api', generalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ThreatX Threat Detection Engine' });
});

app.use('/api/auth', authRouter);
app.use('/api/servers', serversRouter);
app.use('/api/events', eventsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/agent', agentRouter);
app.use('/api/assistant', assistantRouter);

async function startServer() {
  await connectMongo();
  await initDb();
  seedDemoData();

  httpServer.listen(PORT, () => {
    console.log(`ThreatX API with Socket.IO running on http://localhost:${PORT}`);
  });
}

startServer();
