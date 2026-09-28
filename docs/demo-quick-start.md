# ThreatX — Hackathon Quick Start Guide ⚡

Welcome to **ThreatX**, an AI-powered Security Operations Center (SOC) and real-time threat intelligence platform. This guide will get you up and running in **under 2 minutes**.

---

## 1. Prerequisites

Make sure you have installed:
- **Node.js** (v18 or v20+)
- **Python** (v3.9+)
- **MongoDB** (v5.0+ or v6.0+) running on `127.0.0.1:27017`

---

## 2. Fast Setup (3 Commands)

```bash
# 1. Install all dependencies
npm install

# 2. Seed baseline SOC data (Servers, Users, Alerts, Threats, Sessions)
npm run seed

# 3. Start all services concurrently
npm run demo
```

The system will automatically initialize:
- **React SOC Web Console:** [http://localhost:5173](http://localhost:5173)
- **Express Central API Gateway:** [http://localhost:3001](http://localhost:3001)
- **Python Simulated Target Server:** [http://localhost:5001](http://localhost:5001)

---

## 3. Demo Credentials

The database is pre-seeded with 3 role-delineated user accounts:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@threatx.io` | `Admin@ThreatX2026!` | Full access: User management, system configs, threat triage, alert mitigation |
| **SOC Analyst** | `analyst@threatx.io` | `Analyst@ThreatX2026!` | Operational access: Threat investigation, alert status changes, report generation |
| **Viewer** | `viewer@threatx.io` | `Viewer@ThreatX2026!` | Read-only access: Executive dashboards, analytics, audit logs |

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
3. Click **Execute** and observe instantaneous push notifications, AI risk score calculation, and activity feed updates without refreshing!

### Method B: REST API
```bash
curl -X POST http://localhost:3001/api/demo/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "critical-threat"}'
```

---

## 5. Safe Demo Reset

To clean up all dynamically generated simulation artifacts and restore the clean baseline:
- Click **`DEMO MODE`** in the UI → select **Safe Demo Reset** → click **Confirm Safe Demo Reset**.
- Or run via terminal:
```bash
npm run reset:demo
```

---

## 6. Troubleshooting

- **MongoDB Connection Error:** Ensure MongoDB service is running (`net start MongoDB` or `brew services start mongodb-community`). If offline, ThreatX will automatically activate its resilient in-memory store.
- **Port In Use (3001 or 5173):** Check for existing running node processes with `npx kill-port 3001 5173 5001`.
- **Python Dependencies Missing:** Run `pip install flask requests` inside `demo-server/`.
