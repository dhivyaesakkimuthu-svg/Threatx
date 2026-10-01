# TheadX — AI-Powered Cybersecurity Platform

Enterprise-grade SaaS security dashboard with real-time threat detection, behavioral analysis, and incident management.

## Features

### Security Dashboard
- Total Servers, Active Users, Live Threats, Security Score
- Risk Distribution charts (Low / Medium / High)
- Recent Login Activity feed
- 24-hour Threat Timeline

### AI Threat Detection Engine
Continuously analyzes server activity logs and detects:
- Unknown IP logins
- Unusual login times
- New/unrecognized devices
- Brute-force (failed login attempts)
- Impossible travel (geolocation anomalies)
- Unauthorized access to confidential files
- Restricted folder access
- Mass downloading of sensitive files

Each event receives a **risk score (0–100)** and classification (**Low / Medium / High**). High-risk events auto-create incidents and alerts.

### Pages
| Page | Description |
|------|-------------|
| Dashboard | Real-time security overview with charts |
| Servers | Manage monitored infrastructure |
| Add Server | Generate API keys & install monitoring agent |
| Threat Monitor | Live events with risk badges & recommended actions |
| Incidents | Investigation history & threat reports |
| Analytics | Threat type distribution & user risk profiles |
| Alerts | High-risk notification center |
| Reports | Export security reports |
| Settings | Detection sensitivity & notifications |
| Profile | Account management |

## Quick Start

```bash
# Install root dependencies
npm install

# Install client, server & demo-server dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..
cd demo-server && npm install && cd ..

# Run backend, frontend, and demo telemetry server concurrently
npm run dev
```

- **Frontend Dashboard:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Demo Server:** Continuously pushes simulated telemetry to backend

Demo data is seeded automatically on first server start.

## Demo Server

The `demo-server/` service simulates a live monitored machine generating background user activities and anomalous attack events:

- **Monitored Node Simulation:** Continuously generates realistic user logins, logouts, file access, and downloads across 5 employee profiles.
- **Pre-Shared API Authentication:** Uses the seeded key `tx_demo_key_for_testing_only` to authenticate with `POST /api/events/ingest`.
- **Telemetry Frequency:** Emits an event every ~7 seconds (`EVENT_INTERVAL_MS=7000`), with ~15% being security anomalies (`ANOMALY_RATE=0.15`).
- **Simulated Anomalies:** Generates unknown IP logins, foreign impossible travel, unrecognized devices, restricted file accesses, mass download bursts, and brute-force attacks.
- **Dashboard Visibility:** Appears in the **Servers** page automatically as enrolled infrastructure. Detected threats appear live on the **Threat Monitor** and **Dashboard** within 5 seconds.
- **Configuration:** To adjust emission rate or anomaly frequency, edit [demo-server/.env](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/Threatx-main/demo-server/.env).

## Agent Integration

Send activity logs to the API:

```bash
curl -X POST http://localhost:3001/api/events/ingest \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "userId": "u123",
    "eventType": "login",
    "ipAddress": "192.168.1.50",
    "device": "MacBook Pro",
    "location": { "lat": 40.71, "lng": -74.00, "city": "New York", "country": "US" },
    "success": true
  }'
```

## Verification

Test the AI engine end-to-end with a live ingest:

```bash
curl -X POST http://localhost:3001/api/events/ingest \
  -H "Authorization: Bearer tx_demo_key_for_testing_only" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice.johnson",
    "userId": "u1",
    "eventType": "login",
    "ipAddress": "133.242.18.1",
    "device": "Xiaomi Phone",
    "location": { "lat": 35.6762, "lng": 139.6503, "city": "Tokyo", "country": "JP" },
    "success": true
  }'
```

**Expected response:** 3 threats detected — `unknown_ip` (Medium), `new_device` (Medium), `impossible_travel` (High). High-risk detections auto-create an incident and alert visible in the UI within 5 seconds.

The `tx_demo_key_for_testing_only` key is seeded on first server boot. In production, each enrolled server gets a unique key via `POST /api/servers`.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Recharts, Framer Motion
- **Backend:** Node.js, Express, TypeScript
- **Storage:** JSON file persistence
- **AI Engine:** Behavioral profiling + rule-based anomaly detection

## Project Structure

```
ThreatX/
├── client/          # React frontend (Vite)
├── server/          # Express API & AI threat detection engine
│   ├── src/
│   │   ├── engine/  # AI threat detection & behavior profiles
│   │   ├── routes/  # REST API endpoints
│   │   └── db/      # JSON file storage
│   └── data/        # Persistent data (auto-created)
├── demo-server/     # Simulated monitored machine & telemetry generator
│   └── src/         # Event generator, user profiles & ingest loop
└── package.json     # Root scripts & multi-service orchestrator
```
