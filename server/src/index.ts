import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import serversRouter from './routes/servers.js';
import eventsRouter from './routes/events.js';
import incidentsRouter from './routes/incidents.js';
import dashboardRouter from './routes/dashboard.js';
import agentRouter from './routes/agent.js';
import { seedDemoData } from './seed.js';
import { startSimulator } from './simulator.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ThreatX Threat Detection Engine' });
});

app.use('/api/servers', serversRouter);
app.use('/api/events', eventsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/agent', agentRouter);

seedDemoData();
// startSimulator(); // Disabled: demo-server is now the sole telemetry source

app.listen(PORT, () => {
  console.log(`ThreatX API running on http://localhost:${PORT}`);
});
