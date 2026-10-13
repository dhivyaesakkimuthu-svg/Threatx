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
npm run install:all
```

### 3. Start the Demo Stack

```bash
npm run dev:all
```

This starts the Flask OmniCorp target at [http://localhost:3000](http://localhost:3000), the monitoring client at [http://localhost:5173](http://localhost:5173), and the backend with Socket.IO at [http://localhost:4000](http://localhost:4000). The launcher creates a fresh shared event-ingest token for the target and backend, uses the existing JSON store, and writes process logs under `.runtime/`.

Stop only these launched processes with:

```bash
npm run stop:all
```

The corresponding environment examples are `server/.env.example`, `demo-server/.env.example`, and `client/.env.example`. Set `GEMINI_API_KEY` in `server/.env` to enable optional Gemini explanations; rule-based assessments continue to work when the key is absent or unavailable.

Run the verified low/high/critical scenario from another terminal:

```bash
npm run simulate:attack
```

The client also has a **Simulate Attack** button on the Threat Monitor page. Sign in with `admin@theadx.local` / `admin123`, then open `/threats` to see the live events.

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

- Real-time WebSocket connection on `http://localhost:4000`.
- Emits `threat:new`, `alert:new`, and `incident:new` immediately upon detection.
- Dashboard and Threat Monitor update in real time with a 30-second fallback background poll.

---

## 📦 Build Verification

```bash
npm run build
```
Builds `client`, `server`, and `demo-server` with **0 TypeScript and Vite errors**.
