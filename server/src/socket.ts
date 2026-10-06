import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ThreatEvent, Alert, Incident } from './types.js';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    socket.join('monitoring');

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitThreat(threat: ThreatEvent): void {
  if (io) {
    io.to('monitoring').emit('threat:new', threat);
    io.emit('threat:new', threat);
  }
}

export function emitAlert(alert: Alert): void {
  if (io) {
    io.to('monitoring').emit('alert:new', alert);
    io.emit('alert:new', alert);
  }
}

export function emitIncident(incident: Incident): void {
  if (io) {
    io.to('monitoring').emit('incident:new', incident);
    io.emit('incident:new', incident);
  }
}
