import axios from 'axios';
import { ServerModel } from '../models/Server.js';
import { ThreatModel } from '../models/Threat.js';
import { AlertModel } from '../models/Alert.js';
import { ActivityModel } from '../models/Activity.js';

const DEMO_SERVER_URL = process.env.DEMO_SERVER_URL || 'http://localhost:5001';
const SYNC_INTERVAL_MS = 5000;

let syncTimer = null;
let lastKnownHealth = 'offline';
const processedEventIds = new Set();

export async function fetchDemoServerStatus() {
  try {
    const response = await axios.get(`${DEMO_SERVER_URL}/api/status`, {
      timeout: 2500,
    });

    if (response.data) {
      const data = response.data;
      lastKnownHealth = data.connection_status === 'degraded' ? 'degraded' : 'connected';
      return {
        server_health: data.server_health || 'healthy',
        cpu_usage_percent: typeof data.cpu_usage_percent === 'number' ? data.cpu_usage_percent : (data.cpu_usage ?? 48.0),
        memory_usage_percent: typeof data.memory_usage_percent === 'number' ? data.memory_usage_percent : (data.memory_usage ?? 62.0),
        active_session_count: typeof data.active_session_count === 'number' ? data.active_session_count : (Array.isArray(data.ssh_sessions) ? data.ssh_sessions.length : 4),
        connection_status: data.connection_status || 'connected',
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'demo_server_live',
      };
    }
  } catch (err) {
    lastKnownHealth = 'offline';
  }
  return null;
}

export function getDemoServerHealthStatus() {
  return lastKnownHealth;
}

export default {
  fetchDemoServerStatus,
  getDemoServerHealthStatus,
};
