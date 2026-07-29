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

# Install client & server dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..

# Run both frontend and backend
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

Demo data is seeded automatically on first server start.

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

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Recharts, Framer Motion
- **Backend:** Node.js, Express, TypeScript
- **Storage:** JSON file persistence
- **AI Engine:** Behavioral profiling + rule-based anomaly detection

## Project Structure

```
ThreatX/
├── client/          # React frontend (Vite)
├── server/
│   ├── src/
│   │   ├── engine/  # AI threat detection & behavior profiles
│   │   ├── routes/  # REST API endpoints
│   │   └── db/      # JSON file storage
│   └── data/        # Persistent data (auto-created)
└── package.json     # Root scripts
```
