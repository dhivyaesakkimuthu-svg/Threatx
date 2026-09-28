#!/usr/bin/env node
/**
 * ThreatX Environment Setup Utility
 * Copies .env.example templates to .env for all services if .env doesn't exist.
 * Preserves any existing user configurations without overwriting.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envConfigs = [
  {
    target: path.join(rootDir, '.env'),
    example: path.join(rootDir, '.env.example'),
    name: 'Root Configuration',
  },
  {
    target: path.join(rootDir, 'server', '.env'),
    example: path.join(rootDir, 'server', '.env.example'),
    name: 'Express Central API (server/.env)',
  },
  {
    target: path.join(rootDir, 'client', '.env'),
    example: path.join(rootDir, 'client', '.env.example'),
    name: 'React Frontend (client/.env)',
  },
  {
    target: path.join(rootDir, 'demo-server', '.env'),
    example: path.join(rootDir, 'demo-server', '.env.example'),
    name: 'Python Demo Server (demo-server/.env)',
  },
];

console.log('====================================================');
console.log('🛡️  ThreatX — Environment Configuration Setup');
console.log('====================================================\n');

let createdCount = 0;
let preservedCount = 0;

for (const config of envConfigs) {
  if (fs.existsSync(config.target)) {
    console.log(`[PRESERVED] ${config.name} already exists.`);
    preservedCount++;
  } else if (fs.existsSync(config.example)) {
    fs.copyFileSync(config.example, config.target);
    console.log(`[CREATED]   ${config.name} created from template.`);
    createdCount++;
  } else {
    console.warn(`[WARNING]   Template ${config.example} not found.`);
  }
}

console.log('\n----------------------------------------------------');
console.log(`Setup complete: ${createdCount} created, ${preservedCount} preserved.`);
console.log('You can now run `npm run seed` followed by `npm run demo`.');
console.log('====================================================\n');
