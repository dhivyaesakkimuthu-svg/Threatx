import { randomBytes } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, openSync, existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = resolve(root, '.runtime');
const statePath = resolve(runtime, 'services.json');
const ports = [3000, 4000, 5173];

function portAvailable(port) {
  return new Promise((resolvePort) => {
    const server = createConnection({ host: '127.0.0.1', port });
    server.once('connect', () => { server.destroy(); resolvePort(false); });
    server.once('error', () => resolvePort(true));
  });
}

if (existsSync(statePath)) {
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    const alive = state.processes.filter(({ pid }) => {
      try { process.kill(pid, 0); return true; } catch { return false; }
    });
    if (alive.length) {
      console.error('ThreatX services already appear to be running. Use npm run stop:all first.');
      process.exit(1);
    }
  } catch { /* Replace stale runtime state below. */ }
}

for (const port of ports) {
  if (!await portAvailable(port)) {
    console.error(`Port ${port} is already in use. Stop that service or change the configured port before starting ThreatX.`);
    process.exit(1);
  }
}

mkdirSync(runtime, { recursive: true });
const token = randomBytes(32).toString('hex');
const common = {
  ...process.env,
  SECURITY_INGEST_TOKEN: token,
  CLIENT_ORIGIN: 'http://localhost:5173',
  USE_MONGODB: 'false',
};
const services = [
  { name: 'backend', command: process.execPath, args: [resolve(root, 'server/node_modules/tsx/dist/cli.mjs'), 'watch', 'src/index.ts'], cwd: resolve(root, 'server'), env: { ...common, PORT: '4000' } },
  { name: 'client', command: process.execPath, args: [resolve(root, 'client/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'], cwd: resolve(root, 'client'), env: { ...common, VITE_BACKEND_URL: 'http://localhost:4000', VITE_DEMO_URL: 'http://localhost:3000' } },
  { name: 'demo', command: process.env.PYTHON || 'python', args: ['demo_server.py'], cwd: resolve(root, 'demo-server'), env: { ...common, PORT: '3000', SECURITY_BACKEND_URL: 'http://localhost:4000' } },
];
const processes = [];
for (const service of services) {
  const logPath = resolve(runtime, `${service.name}.log`);
  const logFd = openSync(logPath, 'w');
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    env: service.env,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    windowsHide: true,
  });
  processes.push({ name: service.name, pid: child.pid, log: logPath });
  child.on('error', (error) => console.error(`${service.name} launch error: ${error.message}`));
  child.unref();
}

writeFileSync(statePath, JSON.stringify({ startedAt: new Date().toISOString(), processes }, null, 2));
console.log('ThreatX services launched in background:');
console.log('  Demo portal: http://localhost:3000');
console.log('  Monitoring client: http://localhost:5173');
console.log('  Backend API: http://localhost:4000');
console.log(`Logs: ${runtime}`);
console.log('Stop all: npm run stop:all');

await new Promise((resolveReady) => setTimeout(resolveReady, 1200));
for (const { name, pid } of processes) {
  try { process.kill(pid, 0); } catch {
    console.error(`${name} process failed to start (pid ${pid}); inspect its log in .runtime.`);
  }
}
