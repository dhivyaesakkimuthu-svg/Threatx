# TheadX Python Flask Monitored Node & Telemetry Generator

Simulates an enrolled monitored server running a Python agent with hardware resource tracking (CPU, RAM, Disk, Active Sessions) and automated security event generator.

## Requirements
- Python 3.9+
- Flask
- Requests
- Psutil (optional, provides real hardware metrics)
- Python-dotenv

## Setup & Running

```bash
# Install dependencies
pip install -r requirements.txt

# Start Flask server and telemetry daemon
python app.py
```

Runs on http://localhost:5001.
Pushes events directly to the ThreatX backend at http://localhost:3001/api/events/ingest using `tx_demo_key_for_testing_only`.
