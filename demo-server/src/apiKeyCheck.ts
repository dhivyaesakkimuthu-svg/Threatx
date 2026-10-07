import process from 'node:process';

const MAX_RETRIES = 60;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyApiKey(theadxUrl: string, apiKey: string): Promise<void> {
  const pingPayload = {
    username: 'alice.johnson',
    userId: 'u1',
    eventType: 'login',
    ipAddress: '192.168.1.10',
    device: 'MacBook Pro',
    location: { lat: 40.7128, lng: -74.006, city: 'New York', country: 'US' },
    success: true,
    timestamp: new Date().toISOString(),
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${theadxUrl}/api/events/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(pingPayload),
      });

      if (res.ok) {
        console.log('[DEMO] API key accepted by TheadX');
        return;
      }

      if (res.status === 401) {
        console.error('[DEMO] ❌ API key rejected. Make sure DEMO_API_KEY matches a seeded server in server/data/.');
        process.exit(1);
      }

      console.warn(`[DEMO] ⚠️ Verification returned HTTP ${res.status}: ${res.statusText}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    } catch {
      console.warn(`[DEMO] ❌ Cannot reach TheadX at ${theadxUrl}. Is the backend running? (attempt ${attempt}/${MAX_RETRIES})`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error(`[DEMO] ❌ Could not connect to TheadX after ${MAX_RETRIES} attempts. Exiting.`);
        process.exit(1);
      }
    }
  }
}
