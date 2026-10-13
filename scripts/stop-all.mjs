import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const statePath = resolve(root, '.runtime', 'services.json');
if (!existsSync(statePath)) {
  console.log('No tracked ThreatX services are running.');
  process.exit(0);
}

const { processes = [] } = JSON.parse(readFileSync(statePath, 'utf8'));
for (const service of processes.reverse()) {
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(service.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-service.pid, 'SIGTERM');
    }
    console.log(`Stopped ${service.name} (pid ${service.pid}).`);
  } catch {
    console.log(`${service.name} (pid ${service.pid}) was already stopped.`);
  }
}
unlinkSync(statePath);
