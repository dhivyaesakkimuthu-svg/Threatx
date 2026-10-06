# TheadX — AI-Powered Cybersecurity Platform

Enterprise SaaS Security Operations Center (SOC) dashboard featuring real-time AI-assisted threat detection, behavioral baseline profiling, incident response workflows, and WebSocket event streaming.

---

## 🛠️ Active Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, **Axios** (with JWT request/response interceptors), Recharts, Lucide React, Framer Motion |
| **Real-Time** | **Socket.IO** (instant bi-directional event streaming replacing short polling) |
| **Backend** | Node.js, Express 5, TypeScript, REST APIs |
| **Storage** | Persistent JSON File Storage (`server/src/data/threatx.json`) |
| **Demo Server** | Node.js + TypeScript telemetry generator (with simulated employee activities and security anomalies) |
| **Security & Auth** | **JWT Authentication**, **bcryptjs** password hashing, **Role-Based Access Control (RBAC)** (`admin`, `analyst`, `viewer`), **Helmet** security headers, **Rate Limiting** (`express-rate-limit`), **Zod** schema validation, **Audit Logging** (`server/data/audit.log`) |
| **AI & Detection** | Rule-based threat detection engine (8 detectors), Behavioral baseline profiling, Risk scoring (0–100) |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ & npm

### 2. Install Dependencies

```bash
# Root & JS dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
cd demo-server && npm install && cd ..
```

### 3. Running the Platform

```bash
npm run dev
```

This single command starts:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API with Socket.IO:** [http://localhost:3001](http://localhost:3001)
- **Node.js Telemetry Demo Server:** Automatically pushes simulated telemetry to port 3001

---

## 🔐 Authentication & Roles (RBAC)

The platform is secured with JWT tokens attached to all API requests via Axios interceptors.

### Default Admin Credentials
- **Email:** `admin@theadx.local` *(or `admin@threatx.io`)*
- **Password:** `admin123`
- **Role:** `admin`

### Available Roles
- `admin`: Full administrative access (create servers, regenerate keys, manage incidents and user access).
- `analyst`: Triage threats, update incident lifecycle, commit investigation notes.
- `viewer`: Read-only access to dashboard and analytics.

---

## 🛡️ Security Features

1. **Helmet HTTP Headers**: Enforces strict CSP, HSTS, X-Content-Type-Options, and Frameguard.
2. **Dual-Tier Rate Limiting**:
   - `/api/*`: 100 requests / 15 minutes per IP.
   - `/api/events/ingest`: 1,000 requests / 15 minutes per IP.
3. **Zod Input Validation**: Validates all incoming payloads on `/api/events/ingest`, `/api/servers`, `/api/incidents/*`.
4. **Audit Logging**: Logs every state mutation (`POST`, `PATCH`, `DELETE`) with timestamp, user ID, method, path, IP, and status to `server/data/audit.log`.

---

## ⚡ Socket.IO Real-Time Feeds

- Real-time WebSocket connection on `http://localhost:3001`.
- Emits `threat:new`, `alert:new`, and `incident:new` immediately upon detection.
- Dashboard and Threat Monitor update in real time with a 30-second fallback background poll.

---

## 📦 Build Verification

```bash
npm run build
```
Builds `client`, `server`, and `demo-server` with **0 TypeScript and Vite errors**.
