# ThreatX Python Telemetry Demo Server

Monitored host telemetry collector and event simulation server for ThreatX, powered by Python Flask and `psutil`.

## Prerequisites
- Python 3.10+
- pip

## Installation

```bash
pip install -r requirements.txt
```

## Running the Server

```bash
# Using Flask CLI
python -m flask --app app.main run --port 5001

# Or running directly
python app/main.py
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `THEADX_URL` | `http://localhost:3001` | ThreatX backend ingest URL |
| `DEMO_API_KEY` | `tx_demo_key_for_testing_only` | Server API authentication key |
| `EVENT_INTERVAL` | `7` | Seconds between telemetry events |
| `ANOMALY_RATE` | `0.05` | Anomaly generation probability (5%) |
| `PORT` | `5001` | Local Flask HTTP listening port |

## Endpoints

- `GET /health` - Healthcheck and telemetry payload
- `GET /telemetry` - Live CPU, memory, disk, and session telemetry
- `GET /users` - List of configured demo user profiles
- `POST /trigger` - Manually trigger an on-demand security anomaly
