# Demo Target Server & ThreatX Agent

This folder contains a simulated target server and a ThreatX monitoring agent designed to stream real-time cybersecurity telemetry to the ThreatX detection engine.

## Components

1. **`demo_server.py`**:
   - Simulated target Linux server listening on **port 5001**.
   - Serves the interactive **OmniCorp Staff Portal** at `http://localhost:5001/` and `http://localhost:5001/portal`.
   - Exposes REST endpoints for health monitoring, log streaming (`/api/logs`), user actions, and remote mitigation (`/api/action/block-user`).

2. **`theartx_agent.py`**:
   - Python monitoring agent running on the target server.
   - Polls security telemetry from `http://localhost:5001` and sends heartbeats & log batches to ThreatX (`http://localhost:3001/api/agent/ingest`).
   - Receives and executes real-time mitigation commands (e.g. blocking suspicious users).

3. **`omnicorp_portal.html`**:
   - Interactive employee activity and attack simulator UI.
   - Triggers simulated logins, failed brute-force attacks, confidential downloads, and impossible travel geolocations.

4. **`theartx_config.py`**:
   - Contains default API authentication key (`THEARTX_API_KEY`).

## Quick Start

### 1. Install Requirements
```bash
pip install -r requirements.txt
```

### 2. Start Demo Server
```bash
python demo_server.py
```
Access the simulator portal at: **http://localhost:5001**

### 3. Start Monitoring Agent
```bash
python theartx_agent.py --theartx-url http://localhost:3001
```
