# ThreatX — Production & Local Deployment Guide

This guide covers deployment architectures, environment configurations, and operational workflows for the **ThreatX Next-Gen Cybersecurity SOC & Threat Intelligence Platform**.

---

## 1. System Architecture & Port Allocation

ThreatX consists of four core microservices communicating over dedicated ports:

| Service | Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| **React SOC Frontend** | `5173` | HTTP / WS | Web-based SOC operator dashboard & investigation UI |
| **Express Central API** | `3001` | HTTP / Socket.IO | Central REST API gateway, JWT auth, AI threat engine |
| **Python Demo Server** | `5001` | HTTP / REST | Target server simulation & telemetry generator |
| **MongoDB Database** | `27017` | MongoDB Wire | Primary persistence store (`threatx_db`) |

```
                       ┌─────────────────────────────────┐
                       │   ThreatX SOC Web Console       │
                       │     (React / Vite :5173)        │
                       └────────────────▲────────────────┘
                                        │
                         HTTP REST & Socket.IO Push
                                        │
                                        ▼
                       ┌─────────────────────────────────┐
                       │    ThreatX Central API Gateway  │
                       │     (Node.js / Express :3001)   │
                       └────────▲───────────────▲────────┘
                                │               │
                     Database Persistence   Telemetry & Heartbeats
                                │               │
                                ▼               ▼
     ┌────────────────────────────┐   ┌────────────────────────────┐
     │      MongoDB Database      │   │  Simulated Target Server   │
     │ (threatx_db on port 27017) │   │ (Python Flask on port 5001)│
     └────────────────────────────┘   └────────────────────────────┘
```

---

## 2. Environment Configurations

Ensure environment files are configured before launching.

### Express API (`server/.env`)
```bash
PORT=3001
NODE_ENV=production
THREATX_VERSION=1.0.0
DEMO_MODE=true
MONGODB_URI=mongodb://127.0.0.1:27017/threatx_db
DEMO_SERVER_URL=http://localhost:5001
DEMO_SERVER_API_KEY=tx_227c2920cc9599872b69f6fcf5db4e7a877ff217a8476e0b
JWT_SECRET=your_production_secret_key_change_me
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@threatx.io
ADMIN_PASSWORD=Admin@ThreatX2026!
```

### React Client (`client/.env`)
```bash
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_DEMO_MODE=true
```

---

## 3. Option A: Local Development Deployment

### Step 1 — Start MongoDB
Ensure MongoDB 6.0+ is running locally on port `27017`:
```bash
# Windows Service:
net start MongoDB

# Linux / macOS:
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Step 2 — Install Root Dependencies
```bash
npm install
```

### Step 3 — Seed Baseline Data
```bash
npm run seed
```

### Step 4 — Run All Services in Parallel
```bash
# Starts Express API (:3001), React Frontend (:5173), and Python Demo Server (:5001)
npm run demo
```

Alternatively, run services in separate terminals:
- **Terminal 1 (Demo Server):** `python demo-server/demo_server.py`
- **Terminal 2 (Express API):** `npm run dev:server`
- **Terminal 3 (React Client):** `npm run dev:client`

---

## 4. Option B: Docker Containerized Deployment

ThreatX includes production-ready Dockerfiles and a `docker-compose.yml` that orchestrates all 4 services with automatic networking and health checks.

### Single-Command Docker Launch:
```bash
docker-compose up --build
```

### Stopping the Stack:
```bash
docker-compose down
```

### Resetting Docker Data Volume:
```bash
docker-compose down -v
```

---

## 5. Health & Observability Endpoints

| Endpoint | Method | Response | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | JSON | Deep cluster health status (`healthy`, `degraded`, `offline`), latency & memory stats |
| `/api/status` | `GET` | JSON | Live target server status (CPU, memory, active sessions) |
| `/api/info` | `GET` | JSON | Safe system version metadata (`v1.0.0`) and feature manifest |

---

## 6. Graceful Shutdown & Process Management

The Express API cleanly intercepts `SIGINT` (Ctrl+C) and `SIGTERM`:
1. Terminates active background telemetry sync intervals.
2. Closes the Socket.IO real-time event bus.
3. Stops accepting new inbound HTTP requests.
4. Closes the MongoDB database connection.
5. Exits cleanly with code 0 without creating orphan worker threads.
