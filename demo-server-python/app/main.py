"""
ThreatX Python Monitored Node & Telemetry Daemon
Flask app running on port 5001.
"""
import datetime
import os
from pathlib import Path
import random
import sys
import threading
import time

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

load_dotenv()

try:
    from app.telemetry import get_telemetry_snapshot
    from app.users import USERS
    from app.simulator import simulator
except (ImportError, ValueError):
    from telemetry import get_telemetry_snapshot
    from users import USERS
    from simulator import simulator

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

PORT = int(os.getenv("PORT", "5001"))
THEADX_URL = os.getenv("THEADX_URL", "http://localhost:3001")
DEMO_API_KEY = os.getenv("DEMO_API_KEY", os.getenv("API_KEY", "tx_demo_key_for_testing_only"))


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "ThreatX Python Telemetry Daemon",
        "status": "online",
        "port": PORT,
        "backendUrl": THEADX_URL,
        "simulatorActive": simulator.is_running,
        "eventsSent": simulator.events_sent,
    })


@app.route("/health", methods=["GET"])
def health():
    """GET /health -> { status: 'ok', telemetry: <snapshot> }"""
    snapshot = get_telemetry_snapshot()
    return jsonify({
        "status": "ok",
        "telemetry": snapshot,
    })


@app.route("/telemetry", methods=["GET"])
def telemetry():
    """GET /telemetry -> live psutil snapshot"""
    snapshot = get_telemetry_snapshot()
    return jsonify(snapshot)


@app.route("/users", methods=["GET"])
def get_users():
    """GET /users -> list of demo users"""
    return jsonify(USERS)


@app.route("/trigger", methods=["POST"])
def trigger_anomaly():
    """POST /trigger -> manually trigger an anomaly"""
    body = request.get_json(silent=True) or {}
    forced_type = body.get("type") or body.get("scenario")
    user = random.choice(USERS)
    success = simulator.generate_and_push(user, is_anomaly=True, force_anomaly_type=forced_type)
    return jsonify({
        "success": success,
        "triggeredUser": user["username"],
        "anomalyType": forced_type or "random",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    })


def verify_connection_and_start_simulator():
    """Verify API key and start the background simulator thread"""
    print(f"[PY-DEMO] Starting Flask demo server on port {PORT}")
    ingest_url = f"{THEADX_URL.rstrip('/')}/api/events/ingest"
    headers = {
        "Authorization": f"Bearer {DEMO_API_KEY}",
        "Content-Type": "application/json",
    }
    test_event = {
        "userId": "u1",
        "username": "alice.johnson",
        "eventType": "login",
        "ipAddress": "192.168.1.10",
        "device": "MacBook Pro",
        "location": {"lat": 40.7128, "lng": -74.006, "city": "New York", "country": "US"},
        "success": True,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "telemetry": get_telemetry_snapshot(),
    }

    connected = False
    for attempt in range(1, 21):
        try:
            res = requests.post(ingest_url, json=test_event, headers=headers, timeout=4)
            if res.status_code in [200, 201]:
                print("[PY-DEMO] API key accepted by TheadX")
                connected = True
                break
            elif res.status_code == 401:
                print(f"[PY-DEMO] ⚠️ Unauthorized (check DEMO_API_KEY in .env): {res.text}")
                break
            else:
                print(f"[PY-DEMO] Connecting to TheadX at {THEADX_URL}... (status {res.status_code}, attempt {attempt}/20)")
        except Exception:
            # Backend not reachable yet
            if attempt == 1 or attempt % 5 == 0:
                print(f"[PY-DEMO] Connecting to TheadX at {THEADX_URL}... (attempt {attempt}/20)")
        time.sleep(2)

    if not connected:
        print(f"[PY-DEMO] ⚠️ Could not reach TheadX after 20 attempts. Simulator will continue in background.")

    simulator.start()


_init_started = False
_init_lock = threading.Lock()


def _start_daemon_on_load():
    global _init_started
    with _init_lock:
        if not _init_started:
            _init_started = True
            t = threading.Thread(target=verify_connection_and_start_simulator, daemon=True)
            t.start()


# Trigger initialization on module load
_start_daemon_on_load()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
