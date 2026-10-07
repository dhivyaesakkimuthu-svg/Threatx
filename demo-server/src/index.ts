import 'dotenv/config';
import process from 'node:process';
import { verifyApiKey } from './apiKeyCheck.js';
import { USERS } from './users.js';
import { generateEvent, generateAnomalyBurst } from './events.js';

const THEADX_URL = process.env.THEADX_URL ?? 'http://localhost:3001';
const API_KEY = process.env.DEMO_API_KEY ?? 'tx_demo_key_for_testing_only';
const INTERVAL = Number(process.env.EVENT_INTERVAL_MS ?? 7000);
const ANOMALY_RATE = Number(process.env.ANOMALY_RATE ?? 0.15);

async function main() {
  await verifyApiKey(THEADX_URL, API_KEY);
  console.log(`[DEMO] Simulator running — event every ${INTERVAL}ms, anomaly rate ${ANOMALY_RATE * 100}%`);

  setInterval(async () => {
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    const isAnomaly = Math.random() < ANOMALY_RATE;
    const payload = isAnomaly ? generateAnomalyBurst(user) : [generateEvent(user, false)];
    const body = payload.length === 1 ? payload[0] : { logs: payload };

    try {
      const res = await fetch(`${THEADX_URL}/api/events/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[DEMO] ❌ push failed HTTP ${res.status}: ${errText}`);
        return;
      }

      const data = await res.json();
      const threatCount = data.threats?.length ?? 0;
      const label = isAnomaly ? '🚨 ANOMALY' : '✅ normal ';
      console.log(`[DEMO] ${label} ${user.username} → ${payload.length} event(s), ${threatCount} threat(s) detected`);
    } catch (err) {
      console.error('[DEMO] ❌ push failed:', (err as Error).message);
    }
  }, INTERVAL);
}

main();
