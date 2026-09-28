# ThreatX — Hackathon Quick Start Guide ⚡

Welcome to **ThreatX**, an AI-powered Security Operations Center (SOC) and real-time threat intelligence platform. This guide allows teammates, judges, or reviewers to get up and running in **under 2 minutes**.

---

## 1. Prerequisites

Ensure your environment has:
- **Node.js** (v18 or v20+)
- **Python** (v3.9+)
- **MongoDB** (v5.0+ or v6.0+) running on `127.0.0.1:27017`

---

## 2. Fast Setup (3 Commands)

```bash
# 1. Install all dependencies across root, client, and server
npm install

# 2. Seed baseline SOC data (Servers, Users, Alerts, Threats, Sessions, Reports)
npm run seed

# 3. Start all services concurrently (Express :3001, Frontend :5173, Python Demo :5001)
npm run demo
```

The system initializes three coordinated services:
- **React SOC Web Console:** [http://localhost:5173](http://localhost:5173)
- **Express Central API Gateway:** [http://localhost:3001](http://localhost:3001)
- **Python Simulated Target Server:** [http://localhost:5001](http://localhost:5001)

---

## 3. Demo Credentials

The database is pre-seeded with 3 role-delineated user accounts:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@threatx.io` | `Admin@ThreatX2026!` | Full administrative control, user role management, system settings |
| **SOC Analyst** | `analyst@threatx.io` | `Analyst@ThreatX2026!` | Threat investigation, alert triage, AI analysis review, report generation |
| **Viewer** | `viewer@threatx.io` | `Viewer@ThreatX2026!` | Read-only executive dashboards, analytics, audit log inspection |

---

## 4. Running Attack Simulations & Scenarios

You can trigger controlled security events in two ways:

### Method A: Interactive UI (Recommended)
1. In the top navigation bar, click the glowing **`DEMO MODE`** button with the ⚡ icon.
2. Select any of the 5 scenarios:
   - **Scenario 1: Normal Operations** — Routine logins & baseline telemetry.
   - **Scenario 2: Suspicious Login Burst** — Rapid failed auth burst from `192.168.1.200`.
   - **Scenario 3: Server Resource Anomaly** — CPU spike to 94.8% on target node `SRV-001`.
   - **Scenario 4: High-Risk Privilege Escalation** — Unauthorized sensitive file download `/srv/app/.env`.
   - **Scenario 5: Critical Threat + Alert** — Credential dump attack from `203.0.113.199`.
3. Click **Execute** and observe instantaneous push notifications, AI risk score calculation, and activity feed updates without page reloads.

### Method B: REST API
```bash
curl -X POST http://localhost:3001/api/demo/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "critical-threat"}'
```

---

## 5. Safe Demo Reset

To clean up dynamically generated simulation artifacts and restore the clean baseline:
- Click **`DEMO MODE`** in the UI → select **Safe Demo Reset** → click **Confirm Safe Demo Reset**.
- Or execute via terminal:
```bash
npm run reset:demo
```

---

## 6. Verification & Health Check

Run the automated diagnostic utility to verify all services:
```bash
node scripts/health-check.js
```

Or run the full test suite:
```bash
npm run test
```
