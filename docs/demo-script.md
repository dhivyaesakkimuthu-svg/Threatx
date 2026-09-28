# ThreatX — 5 to 7 Minute Hackathon Demo Script 🎙️

Use this structured walkthrough to deliver a compelling, high-impact demonstration of ThreatX to hackathon judges, technical evaluators, or stakeholders.

---

## ⏱️ Walkthrough Timeline

### Minute 0:00 – 1:00 | Introduction & Architecture
- **Action:** Open [http://localhost:5173](http://localhost:5173) and sign in as `admin@threatx.io` (`Admin@ThreatX2026!`).
- **Talking Points:**
  - *"Welcome to ThreatX. Modern security teams face telemetry fatigue—thousands of alerts without real-time context. ThreatX solves this by combining live target telemetry, deterministic MongoDB persistence, bi-directional Socket.IO push streaming, and an embedded heuristic AI threat intelligence engine."*
  - Point out the **Sys Status** badge in the top right: click it to show live health across Express (:3001), Python Demo Server (:5001), MongoDB (:27017), and Socket.IO latency (<15ms).

### Minute 1:00 – 2:00 | Real-Time SOC Dashboard & Telemetry
- **Action:** Highlight the Dashboard elements:
  - Active server health metrics (CPU: 48%, Memory: 62%, Active SSH sessions: 4).
  - Risk distribution doughnut chart and hourly incident timeline.
  - Active SSH user sessions table with geo-locations and risk ratings.
- **Talking Points:**
  - *"Notice that all server telemetry flows live from our simulated target server on port 5001. When server state changes, telemetry graphs and session cards update instantly without page reloading."*

### Minute 2:00 – 3:30 | Controlled Attack Simulation & Instant AI Triage
- **Action:** Click the **`DEMO MODE`** button in the top navigation bar.
  - Select **Scenario 5: Critical Multi-Vector Threat + Alert (Credential Dump)**.
  - Click **Execute**.
- **Observe Live:**
  - An instant **Notification Toast** slides in at the top right: *"Critical Threat Intercepted: CREDENTIAL DUMP"*.
  - The **Active Threats** counter increments.
  - An item is immediately prepended to the **Live Activity Feed**.
- **Talking Points:**
  - *"We just triggered an automated credential extraction probe. The telemetry passed through Express to our AI Threat Intelligence Engine, which calculated a Risk Score of 98, generated mitigation playbooks, persisted the threat to MongoDB, and broadcast the event over WebSockets."*

### Minute 3:30 – 4:30 | Threat Investigation & Alert Mitigation
- **Action:** Open the **Threat Investigation Modal** by clicking on the new critical threat.
  - Show the **AI Explanation**, confidence metrics, and recommended MITRE action items.
  - Navigate to **Alerts** in the sidebar.
  - Open the Alert drawer, change its status from **Open** to **Investigating**, add an investigation note, and mark as **Resolved**.
- **Talking Points:**
  - *"SOC analysts have complete lifecycle triage capabilities. Every status transition, note addition, and mitigation step is audited in our tamper-resistant security audit log."*

### Minute 4:30 – 5:30 | RBAC, Audit Logging & Security Analytics
- **Action:** Navigate to **Audit Logs** and **Analytics** in the sidebar.
  - Show the logged user action with IP address, user agent, and timestamp.
  - Navigate to **User Management** (available for Administrator). Show role delineation (`admin`, `analyst`, `viewer`).
- **Talking Points:**
  - *"ThreatX enforces strict JWT-based authentication with bcrypt hashing, rate limiting, Helmet HTTP security headers, and granular Role-Based Access Control."*

### Minute 5:30 – 6:30 | System Info, Reset & Conclusion
- **Action:** Open **Settings** → **System & Architecture**.
  - Show cluster version **v1.0.0**, active transports, and REST gateways.
  - Open **DEMO MODE** modal and demonstrate the **Safe Demo Reset** feature.
- **Talking Points:**
  - *"ThreatX is designed for reliability—with graceful shutdown handlers, non-destructive demo seeds, zero-dependency in-memory fallback, and full Docker containerization."*
  - *"Thank you! We welcome any questions."*
