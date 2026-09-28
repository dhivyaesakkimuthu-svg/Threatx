import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket = null;
const connectionStateListeners = new Set();

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to ThreatX Real-time Hub');
      connectionStateListeners.forEach((cb) => cb(true));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      connectionStateListeners.forEach((cb) => cb(false));
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
      connectionStateListeners.forEach((cb) => cb(false));
    });
  }
  return socket;
}

export function subscribeToConnectionState(callback) {
  connectionStateListeners.add(callback);
  const s = getSocket();
  callback(s.connected);
  return () => {
    connectionStateListeners.delete(callback);
  };
}

export function subscribeToTelemetry(callback) {
  const s = getSocket();
  const handler = (data) => {
    callback({
      server_health: data.health || 'healthy',
      cpu_usage_percent: data.cpuUsage ?? 48,
      memory_usage_percent: data.memoryUsage ?? 62,
      active_session_count: data.activeSessions ?? 4,
      connection_status: data.connectionStatus || 'connected',
      timestamp: data.timestamp || new Date().toISOString(),
      source: 'socket_io_realtime',
    });
  };
  s.on('server:telemetry', handler);
  return () => {
    s.off('server:telemetry', handler);
  };
}

export function subscribeToThreats(callback) {
  const s = getSocket();
  s.on('threat:new', callback);
  return () => {
    s.off('threat:new', callback);
  };
}

export function subscribeToThreatUpdates(callback) {
  const s = getSocket();
  s.on('threat:updated', callback);
  return () => {
    s.off('threat:updated', callback);
  };
}

export function subscribeToAlerts(callback) {
  const s = getSocket();
  s.on('alert:new', callback);
  return () => {
    s.off('alert:new', callback);
  };
}

export function subscribeToAlertUpdates(callback) {
  const s = getSocket();
  s.on('alert:updated', callback);
  return () => {
    s.off('alert:updated', callback);
  };
}

export function subscribeToActivities(callback) {
  const s = getSocket();
  s.on('activity:new', callback);
  return () => {
    s.off('activity:new', callback);
  };
}

export function subscribeToSessions(callback) {
  const s = getSocket();
  s.on('session:updated', callback);
  return () => {
    s.off('session:updated', callback);
  };
}

export function subscribeToIntelligence(callback) {
  const s = getSocket();
  s.on('intelligence:new', callback);
  return () => {
    s.off('intelligence:new', callback);
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  getSocket,
  subscribeToConnectionState,
  subscribeToTelemetry,
  subscribeToThreats,
  subscribeToThreatUpdates,
  subscribeToAlerts,
  subscribeToAlertUpdates,
  subscribeToActivities,
  subscribeToSessions,
  subscribeToIntelligence,
  disconnectSocket,
};
