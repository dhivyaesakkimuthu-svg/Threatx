# ThreatX — Next-Gen AI-Powered SOC & Real-Time Threat Intelligence Platform 🛡️

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/server/package.json)
[![Stack](https://img.shields.io/badge/stack-React_19%20%7C%20Node.js%20%7C%20Flask%20%7C%20MongoDB-cyan.svg)](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/package.json)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/package.json)

ThreatX is a full-stack, enterprise-grade Security Operations Center (SOC) platform designed for real-time cyber threat detection, target server telemetry ingestion, AI-driven anomaly analysis, and incident triage.

---

## 🎯 Problem & Solution

### The Problem
Modern infrastructure environments generate hundreds of disparate authentication logs, process execution traces, and telemetry signals every second. Security teams face:
1. **Alert Fatigue:** SOC analysts are overwhelmed by noisy, unprioritized alerts without context.
2. **Delayed Anomaly Detection:** Brute-force attacks, privilege escalation, and credential dumping are often noticed only after data exfiltration.
3. **Disconnected Tools:** Telemetry monitoring, threat intelligence, session tracking, and compliance reporting live in siloed, expensive proprietary tools.

### The ThreatX Solution
ThreatX solves this by delivering an integrated, high-throughput, self-contained SOC suite:
- **Unified Real-Time Visibility:** Direct bi-directional WebSocket telemetry stream updating dashboards instantaneously.
- **Multi-Factor Heuristic AI Engine:** Automated scoring that computes risk (0–100) and extracts explainable anomaly reasons.
- **Built-in Attack Simulation:** 5 deterministic scenarios to validate detection playbooks and demonstrate SOC capabilities safely.
- **Enterprise RBAC & Auditing:** Strict role segregation (`admin`, `analyst`, `viewer`) with tamper-evident audit logging.

---

## 🏗️ System Architecture

ThreatX operates across four synchronized tiers:

```
                               ┌─────────────────────────────────────────┐
                               │       ThreatX React SOC Web Console     │
                               │           http://localhost:5173         │
                               └────────────────────▲────────────────────┘
                                                    │
                                     HTTP REST / Bi-directional Socket.IO
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │        Central Express API Gateway      │
                               │           http://localhost:3001         │
                               │   (Auth, RBAC, AI Anomaly Engine, SIEM) │
                               └──────────▲───────────────────▲──────────┘
                                          │                   │
                                MongoDB Persistence   Telemetry Sync & Logs
                                          │                   │
                                          ▼                   ▼
                     ┌──────────────────────────┐   ┌──────────────────────────┐
                     │     MongoDB Database     │   │   Python Target Server   │
                     │  mongodb://localhost:27017│   │   http://localhost:5001  │
                     │       (threatx_db)       │   │   (Synthetic Telemetry)  │
                     └──────────────────────────┘   └──────────────────────────┘
```

---

## ✨ Core Features

- **Enterprise Security Posture Panel:** Dynamically calculates cluster security status (`NORMAL` → `ELEVATED` → `HIGH RISK` → `CRITICAL`) and composite risk score (`0–100`) directly from live unmitigated threat events and critical alerts.
- **Live SOC Dashboard:** Real-time gauges for CPU/Memory utilization, active SSH sessions, risk breakdown, and incident timelines.
- **AI Threat Intelligence Engine:** Multi-factor anomaly scoring combining IP reputation, geographical travel plausibility, user session velocity, and resource spikes.
- **Target Server Telemetry Ingestion:** Continuous background synchronization with target nodes on port `5001`.
- **Real-Time Push Notifications:** Socket.IO WebSocket bus for zero-latency alert dispatches without page reloading.
- **Role-Based Access Control (RBAC):** Tiered roles (`admin`, `analyst`, `viewer`) with JWT session authorization and bcrypt hashing.
- **Incident & Alert Lifecycle Management:** Status triage (`open` → `investigating` → `resolved` → `dismissed`) with full investigation audit trails.
- **Security Reports & Auditing:** Full report inspection modal, automated PDF/JSON/CSV exports, and executive compliance brief generation.
- **Attack Simulation Engine:** 5 safe, controllable cyber attack scenarios accessible via UI and REST endpoints.
- **Production Resilience:** Graceful shutdown routines (`SIGINT`/`SIGTERM`), in-memory fallback stores, and Docker multi-stage builds.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client |
| **Backend API** | Node.js 20+, Express 5, TypeScript, Mongoose, JWT, Helmet, Express Rate Limit |
| **AI / Heuristic Engine** | Custom Multi-Factor Rule & Behavioral Threat Analyzer (`threatIntelligenceService`) |
| **Simulated Target** | Python 3.11, Flask, Background Audit Threads |
| **Primary Database** | MongoDB 6.0+ (`threatx_db`) |
| **Containerization** | Docker, Docker Compose |

---

## 📂 Project Structure

```
ThreatX/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── components/         # SOC UI components, Topbar, Modals, Feed
│   │   ├── context/            # AuthContext & Session management
│   │   ├── pages/              # Dashboard, Threats, Servers, Alerts, Analytics, Users, Settings
│   │   └── services/           # Axios API client & Socket.IO listeners
│   ├── .env.example            # Client environment template
│   └── Dockerfile              # Multi-stage Nginx container build
├── server/                     # Express Central API Gateway
│   ├── src/
│   │   ├── config/             # MongoDB connection & fallback handlers
│   │   ├── middleware/         # JWT Auth, RBAC guards, Rate limiters
│   │   ├── models/             # Mongoose schemas (Threat, Alert, Server, User, Audit)
│   │   ├── routes/             # REST endpoints (auth, threats, servers, demo, health)
│   │   ├── services/           # Telemetry sync & AI Threat Intelligence engine
│   │   └── tests/              # Automated unit and integration test suites
│   ├── .env.example            # Server environment template
│   └── Dockerfile              # Production Node.js alpine container
├── demo-server/                # Python Simulated Target Server
│   ├── demo_server.py          # Flask target server (Port 5001)
│   ├── requirements.txt        # Python dependencies (Flask, requests)
│   └── Dockerfile              # Python container build
├── docs/                       # Comprehensive platform documentation
│   ├── deployment.md           # Production & local deployment guide
│   ├── demo-quick-start.md     # 2-minute hackathon setup guide
│   └── demo-script.md          # 5-7 minute presentation script
├── docker-compose.yml          # Complete 4-tier stack container orchestration
├── package.json                # Root package manager & workspace scripts
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start & Startup Commands

### 1. Prerequisites
- **Node.js:** v18 or v20+
- **Python:** v3.9+
- **MongoDB:** v5.0+ or v6.0+ (running locally on port `27017`)

### 2. Environment Setup
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
cp demo-server/.env.example demo-server/.env
```

### 3. Installation & Database Seeding
```bash
# Install root, server, and client dependencies
npm install

# Seed deterministic baseline data (users, servers, threats, alerts)
npm run seed
```

### 4. Running the Platform

| Command | Action |
| :--- | :--- |
| **`npm run dev`** | Starts Express API (`:3001`) and React Frontend (`:5173`) |
| **`npm run demo`** | Starts all 3 services: Express (`:3001`), React (`:5173`), and Demo Server (`:5001`) |
| **`npm run dev:server`** | Starts only the Express API with hot-reloading |
| **`npm run dev:client`** | Starts only the Vite React dev server |
| **`npm run dev:demo`** | Starts only the Python Demo Target Server |
| **`npm run test`** | Executes all backend test suites (AI engine + Auth/RBAC) |
| **`npm run reset:demo`** | Safely clears attack simulation artifacts and restores clean baseline |
| **`npm run build`** | Runs full production build for both client and server |

---

## 🔑 Pre-Seeded Demonstration Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@threatx.io` | `Admin@ThreatX2026!` | Full administrative control & user management |
| **SOC Analyst** | `analyst@threatx.io` | `Analyst@ThreatX2026!` | Incident triage, alert management, investigation |
| **Viewer** | `viewer@threatx.io` | `Viewer@ThreatX2026!` | Read-only executive reporting & dashboard views |

---

## ⚡ Attack Simulation Scenarios

ThreatX features a built-in scenario engine to trigger controlled security telemetry:

1. **Scenario 1: Normal Operations** — Routine authentication and nominal telemetry.
2. **Scenario 2: Suspicious Login Burst** — Rapid failed authentication attempts targeting administrative ports.
3. **Scenario 3: Server Resource Anomaly** — High CPU (94.8%) and memory usage spikes on target node `SRV-001`.
4. **Scenario 4: High-Risk Privilege Escalation** — Unauthorized sensitive file download attempt on `/srv/app/.env`.
5. **Scenario 5: Critical Threat + Alert** — Multi-node credential dump and SSH brute-force attack.

**Trigger via UI:** Click the **`DEMO MODE`** button in the top navigation bar.  
**Trigger via API:**
```bash
curl -X POST http://localhost:3001/api/demo/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "critical-threat"}'
```

---

## 🩺 Health & Observability Endpoints

- `GET /api/health` — Deep diagnostic status checking MongoDB, Demo Server, Socket.IO bus, and memory metrics.
- `GET /api/status` — Live status and resource usage from connected target servers.
- `GET /api/info` — Public system version (`v1.0.0`) and active capability manifest.

---

## 🐳 Docker Deployment

To spin up the entire isolated stack with Docker Compose:

```bash
docker-compose up --build
```
Access the console at [http://localhost:5173](http://localhost:5173).

---

## 📸 Console Screenshots & Visual Overview

```
+---------------------------------------------------------------------------------------------------+
|  [THREATX SOC]  Dashboard  Intelligence  Threats  Servers  Sessions  Analytics  Audit  Settings   |
+---------------------------------------------------------------------------------------------------+
|  [SYS STATUS: HEALTHY]   [⚡ DEMO MODE]   [MongoDB: CONNECTED]   [Demo Server: CONNECTED]        |
+---------------------------------------------------------------------------------------------------+
|  [ CRITICAL THREATS: 2 ]   [ ACTIVE SERVERS: 3 ]   [ SESSIONS: 4 ]   [ AVG CPU LOAD: 48% ]        |
+---------------------------------------------------------------------------------------------------+
|  +--------------------------------------------+  +---------------------------------------------+  |
|  | Real-Time Incident Timeline & Severity     |  | Live Target Server Telemetry (SRV-001)      |  |
|  | [Chart: 24h Distribution & Anomaly Rate]   |  | [CPU: 48% | MEM: 62% | Ping: 12ms]         |  |
|  +--------------------------------------------+  +---------------------------------------------+  |
|  +---------------------------------------------------------------------------------------------+  |
|  | Intercepted Threat Intelligence Stream (Socket.IO Real-Time Stream)                         |  |
|  | THR-001 | SSH Credential Stuffing | Severity: CRITICAL | Source: 203.0.113.199 | AI Score: 98 |  |
|  | THR-002 | Privilege Escalation    | Severity: HIGH     | Source: 10.0.0.15     | AI Score: 85 |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 🔒 Security Notes & Disclaimer

- **Safe Demonstration Tooling:** All attack simulation routines generate synthetic metadata for visualization and triage testing only. ThreatX contains **no real malware payloads, exploit payloads, credential theft, or destructive tooling**.
- **Production Hardening:** In production environments, replace default JWT secrets in `.env`, configure TLS/HTTPS termination via reverse proxy, and enforce strict IP whitelisting on internal ingestion routes.

---

## ⚠️ Platform Limitations

- **Simulated Agent Telemetry:** Target telemetry is streamed from the embedded Python simulation engine on port `5001`. For real-world production fleets, deploy the lightweight OS audit daemon with mutual TLS.
- **In-Memory Fallback:** When MongoDB is offline, ThreatX falls back to an in-memory datastore so demonstrations never fail, but persistence across restarts requires an active MongoDB instance.
- **Single-Cluster Scope:** The current release is architected for single-datacenter SOC deployments; multi-region cross-cluster federation is planned for v2.0.

---

## 🔮 Future Roadmap & Improvements

- [ ] **SOAR Automated Playbook Execution:** Expand AI recommendations into one-click automated webhook triggers (e.g., automated AWS IAM session revocation, Cloudflare WAF block rules).
- [ ] **MITRE ATT&CK Matrix Mapping:** Full visual matrix integration with heatmaps indicating current threat vector coverage.
- [ ] **Multi-Tenant MSSP Mode:** Delineated organization partitions for Managed Security Service Providers.
- [ ] **SIEM Log Ingestion Adapters:** Native syslog/CEF/JSON connectors for CrowdStrike, Splunk, and AWS CloudTrail.

---

## 📄 Documentation Index

- [Deployment Guide](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/docs/deployment.md)
- [Hackathon Quick Start Guide](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/docs/hackathon-quick-start.md)
- [Final Presentation & Demo Checklist](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/docs/final-demo-checklist.md)
- [5-7 Minute Demonstration Script](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/docs/demo-script.md)
- [Contributing Guidelines](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/CONTRIBUTING.md)
- [License (MIT)](file:///c:/Users/Mohamed%20Suhail/Downloads/Threatx-main/LICENSE)

---

Developed for the ThreatX Security Operations Suite.
