# TheadX — Enterprise AI-Powered Cybersecurity Platform

Enterprise SaaS Security Operations Center (SOC) dashboard featuring real-time AI-assisted threat detection, behavioral baseline profiling, incident response workflows, hardware telemetry streaming, and Gemini AI investigation assistance.

---

## 🛠️ Upgraded Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, **Axios** (JWT interceptors), Recharts, Lucide React, Framer Motion |
| **Real-Time** | **Socket.IO** (instant threat, alert, and incident event streaming) |
| **Backend** | Node.js, Express 5, TypeScript, REST APIs |
| **Database** | **MongoDB + Mongoose** (with resilient auto-fallback to local JSON store), MongoDB Compass compatible |
| **Demo & Telemetry** | **Python 3.10 + Flask** (`demo-server-python`), hardware resource telemetry (`psutil`: CPU, RAM, Disk, Active Process & Session tracking), Node.js demo-server |
| **Security & Auth** | **JWT Authentication**, **bcryptjs** password hashing, **Role-Based Access Control (RBAC)** (`admin`, `analyst`, `viewer`), **Helmet** headers, **Rate Limiting** (`express-rate-limit`), **Zod** schema validation, **Audit Logging** (`server/data/audit.log`) |
| **AI & Intelligence** | **Google Gemini AI** (`@google/generative-ai`), Rule-based anomaly engine (8 detectors), Behavioral baseline profiling, Explainable threat scoring (0–100) |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.9+ & pip
- MongoDB (optional — if MongoDB is offline, server safely falls back to local JSON persistence)

### 2. Install Dependencies

```bash
# Root & JS dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
cd demo-server && npm install && cd ..

# Python Demo Server dependencies
cd demo-server-python
pip install -r requirements.txt
cd ..
```

### 3. Environment Setup

Copy example environments if not already present:
```bash
# Server environment
cp server/.env.example server/.env

# Python Demo Node environment
cp demo-server-python/.env.example demo-server-python/.env
```

Key environment variables in `server/.env`:
- `PORT=3001`
- `MONGODB_URI=mongodb://localhost:27017/theadx`
- `JWT_SECRET=threatx_super_secret_jwt_key_2026`
- `GEMINI_API_KEY=your_gemini_api_key_here` (get from [Google AI Studio](https://aistudio.google.com/))

### 4. Running the Platform

#### Standard Dev Mode (Backend + Frontend + Node Demo)
```bash
npm run dev
```

#### Full Upgraded Dev Mode (Backend + Frontend + Python Flask Demo Server)
```bash
npm run dev:full
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)
- **Python Telemetry Agent:** [http://localhost:5001](http://localhost:5001)

---

## 🔐 Authentication & RBAC

TheadX uses standard JWT authentication with role-based authorization.

### Default Admin Credentials
- **Email:** `admin@theadx.local` *(or `admin@threatx.io`)*
- **Password:** `admin123`
- **Role:** `admin`

### Roles & Permissions
- `admin`: Full platform control (server provisioning, key regeneration, user management, incident management, note commits).
- `analyst`: Triage threats, update incident status, commit investigation notes, invoke Gemini AI investigations.
- `viewer`: Read-only access to dashboard, servers, reports, and threat streams.

---

## 🛡️ Security Hardening

1. **Helmet HTTP Headers**: Enforces strict CSP, HSTS, no-sniff, and frameguard protections.
2. **Dual-Tier Rate Limiting**:
   - Standard `/api/*`: 100 requests / 15 minutes per IP.
   - Telemetry Ingest `/api/events/ingest`: 1,000 requests / 15 minutes per IP.
3. **Zod Input Validation**: Strict validation schemas on ingest, server creation, incident patches, and user notes.
4. **Audit Logging**: Every state-changing request (`POST`, `PATCH`, `DELETE`) is appended to `server/data/audit.log` with timestamp, authenticated user ID, action, endpoint, and source IP.

---

## 🤖 Gemini AI Investigation Assistant

- **Endpoint**: `POST /api/assistant/incident/:id`
- **SOC AI Copilot**: Located in the **Incidents** detail view.
- **Output**: Generates structured executive summaries, likely root causes, confidence ratings, and actionable containment playbooks.
- **Smart In-Memory Caching**: Responses are cached in memory for 10 minutes to conserve API quota and prevent redundant requests.
- **Graceful Fallback**: If `GEMINI_API_KEY` is not configured, a rule-based SOC fallback playbook is returned without crashing.

---

## ⚡ Socket.IO Real-Time Streaming

The platform replaces HTTP polling with bi-directional Socket.IO streaming:
- `threat:new`: Broadcast whenever an anomalous activity triggers detection rules.
- `alert:new`: Broadcast when high-severity threat thresholds are met.
- `incident:new`: Broadcast when automatic incidents are spawned.
- Dashboard and Threat Monitor views update instantly with a 30-second fallback background poll.

---

## 🖥️ Monitored Node & Telemetry (Python Flask)

The `demo-server-python/` node tracks server hardware metrics and generates realistic user activity:
- Collects live **CPU %**, **RAM %**, **Disk %**, **Process counts**, and **User sessions** using `psutil`.
- Runs a 7-second simulation loop with 95% baseline and 5% security anomaly distribution.
- Endpoints:
  - `GET /health`: Health status and telemetry payload.
  - `GET /telemetry`: Live hardware snapshot.
  - `POST /block-user`: Remotely revoke active user sessions.
  - `POST /simulate-attack`: Trigger on-demand attack scenarios (`unknown_ip`, `credential_stuffing`, `mass_download`, etc.).

---

## 📦 Build Verification

To compile and verify all workspaces:
```bash
npm run build
```
Builds `client` (Vite + TypeScript), `server` (TypeScript), and `demo-server` with **0 errors**.
