import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'client', 'package.json'));
const { io } = require('socket.io-client');
const backend = process.env.VITE_BACKEND_URL || 'http://localhost:4000';
const target = process.env.DEMO_URL || 'http://localhost:3000';
const socket = io(backend, { transports: ['websocket'] });
const received = [];
socket.on('security:alert', (event) => received.push(event));

try {
  await new Promise((resolveConnect, reject) => {
    socket.once('connect', resolveConnect);
    socket.once('connect_error', reject);
    setTimeout(() => reject(new Error('Timed out connecting to backend Socket.IO')), 10000).unref();
  });
  const response = await fetch(`${target}/api/simulate/attack`, { method: 'POST' });
  const result = await response.json();
  if (!response.ok) throw new Error(`Simulation endpoint returned ${response.status}: ${JSON.stringify(result)}`);
  const expected = ['LOW', 'HIGH', 'CRITICAL'];
  console.log('Expected:', expected.join(' / '));
  console.log('Received:', (result.levels || []).join(' / '));
  if (JSON.stringify(result.levels) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected severity levels: ${JSON.stringify(result.levels)}`);
  }
  const deadline = Date.now() + 5000;
  while (received.length < 8 && Date.now() < deadline) await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  if (received.length < 8) throw new Error(`Expected 8 live alerts, received ${received.length}`);
  console.log(`Socket.IO delivered ${received.length} security alerts; end-to-end simulation passed.`);
} finally {
  socket.close();
}
