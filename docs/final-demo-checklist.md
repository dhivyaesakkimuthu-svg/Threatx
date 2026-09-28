# ThreatX — Final Hackathon Demo & Release Checklist 📋

Use this comprehensive checklist before and during live presentations, hackathon judging, or production verification.

---

## 🚦 Pre-Flight Service Verification

- [ ] **MongoDB Service Active:** Verified listening on `127.0.0.1:27017` with database `threatx_db`.
- [ ] **Python Demo Server Active:** Verified listening on `http://localhost:5001/api/status`.
- [ ] **Central Express API Active:** Verified listening on `http://localhost:3001/api/health`.
- [ ] **React SOC Frontend Active:** Verified accessible on `http://localhost:5173`.
- [ ] **Clean Baseline Restored:** Ran `npm run reset:demo` to verify deterministic state.

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

- [ ] **Login Flow:** Successfully authenticated with `admin@threatx.io`, `analyst@threatx.io`, and `viewer@threatx.io`.
- [ ] **Protected Routes:** Direct navigation to `/threats` without authentication safely redirects to `/login`.
- [ ] **Token Expiration/Revocation:** 401 response handled gracefully without console crashes.
- [ ] **Role Authorization Enforced:**
  - [ ] `admin`: Has access to `/users`, `/settings`, and role elevation controls.
  - [ ] `analyst`: Has operational triage access to `/threats`, `/alerts`, `/reports`.
  - [ ] `viewer`: Has read-only access to dashboards, charts, and audit logs; cannot edit/delete servers or modify alerts.
- [ ] **Logout Flow:** Clears token from localStorage and redirects immediately to login view.

---

## 📊 Live SOC Operations & Telemetry

- [ ] **Enterprise Security Posture Panel:** Posture banner reflects live risk score (`0–100`) and derived status (`NORMAL`, `ELEVATED`, `HIGH RISK`, `CRITICAL`).
- [ ] **Live Target Server Telemetry:** Real-time CPU/Memory charts on `SRV-001` update smoothly without page reloading.
- [ ] **Server Drilldown Modal:** Clicking any monitored server node opens granular network stats, port list, and process status.
- [ ] **Realtime WebSocket Bus:** Single Socket.IO connection maintained per browser tab; updates broadcast across clients.
- [ ] **Zero Duplicate Listeners:** Re-navigating between pages does not create duplicate event listeners or UI flutters.

---

## 🤖 AI Threat Intelligence & Detection

- [ ] **Multi-Factor Heuristics:** Evaluates IP velocity, brute-force frequency, CPU/Memory spikes, and sensitive endpoint targeting.
- [ ] **Explainable AI Rationale:** Every analyzed threat provides clear, human-readable justification reasons and confidence levels.
- [ ] **Automated Containment Recommendations:** Critical vectors produce clear mitigation advice (e.g. firewall isolation, token invalidation).
- [ ] **Interactive AI Sandbox:** Operators can simulate arbitrary IP/CPU parameters in `/intelligence` and receive immediate risk assessments.

---

## ⚡ 5-Scenario Attack Simulation Engine

- [ ] **Scenario 1 (Normal Operations):** Generates nominal baseline traffic; posture remains `NORMAL`.
- [ ] **Scenario 2 (Suspicious Login Burst):** Triggers rapid failed logins; elevates status to `HIGH RISK` with brute-force anomaly flags.
- [ ] **Scenario 3 (Server Resource Anomaly):** Simulates 94.8% CPU saturation on `SRV-001`; triggers telemetry alerts.
- [ ] **Scenario 4 (High-Risk Privilege Escalation):** Intercepts `.env` configuration file access attempt.
- [ ] **Scenario 5 (Critical Intrusion):** Credential dump attack triggers `CRITICAL` posture banner, push notifications, and high-priority alert queue.

---

## 📝 Incident Triage & Compliance Reporting

- [ ] **Alert Lifecycle Management:** Status transitions cleanly (`open` → `investigating` → `resolved` → `dismissed`).
- [ ] **Threat Mitigation:** Acknowledging a threat transitions status to `mitigated` and updates cluster score in real time.
- [ ] **Report Inspection & Export:** Clicking any compliance report displays details; JSON and CSV downloads generate valid files.
- [ ] **Report Creation:** Modal creates new executive summaries and persists to MongoDB.

---

## 🛡️ Stability, Resilience & Cleanup

- [ ] **Target Server Offline Handling:** If Python demo server is stopped, status badge shows `OFFLINE` / `DEGRADED` without breaking Express or React.
- [ ] **Target Server Recovery:** Resuming Python demo server automatically resumes telemetry stream within 4 seconds.
- [ ] **MongoDB Offline Resilience:** Express falls back to resilient memory store if MongoDB is temporarily interrupted.
- [ ] **No Console Errors:** Browser DevTools console remains clean throughout 10-minute demo.
- [ ] **Build Integrity:** `npm run build` exits with code 0 (both Client Vite and Server `tsc`).
- [ ] **Test Suite Integrity:** `npm run test` exits with code 0 (38/38 tests passing).
