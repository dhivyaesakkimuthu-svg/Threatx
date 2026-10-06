"""
TheadX Monitored Node Flask Server
Runs on port 5001, provides live telemetry and starts background simulation loop.
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path so app package resolves cleanly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from app.telemetry import get_telemetry_snapshot, block_user, unblock_user
    from app.simulator import simulator
    from app.users import USERS
except (ImportError, ValueError):
    from telemetry import get_telemetry_snapshot, block_user, unblock_user
    from simulator import simulator
    from users import USERS

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "service": "TheadX Monitored Node & Telemetry Daemon",
        "status": "online",
        "port": int(os.getenv("PORT", 5001)),
        "backendUrl": simulator.theadx_url,
        "simulatorActive": simulator.is_running,
        "eventsSent": simulator.events_sent,
    })


@app.route("/health", methods=["GET"])
def health():
    """GET /health -> { status: 'ok', telemetry: {...} }"""
    snapshot = get_telemetry_snapshot()
    return jsonify({
        "status": "ok",
        "telemetry": snapshot,
    })


@app.route("/telemetry", methods=["GET"])
def live_telemetry():
    """GET /telemetry -> live CPU/mem/session snapshot"""
    snapshot = get_telemetry_snapshot()
    return jsonify(snapshot)


@app.route("/status", methods=["GET"])
def status():
    """Detailed node and simulator status for TheadX console"""
    snapshot = get_telemetry_snapshot()
    return jsonify({
        "node": {
            "name": "Production Web Node 01",
            "hostname": snapshot["hostname"],
            "platform": snapshot["platform"],
            "uptimeSeconds": snapshot["uptimeSeconds"],
        },
        "metrics": {
            "cpuPercent": snapshot["cpuPercent"],
            "memoryPercent": snapshot["memoryPercent"],
            "diskPercent": snapshot["diskPercent"],
            "activeProcesses": snapshot["activeProcessCount"],
        },
        "sessions": {
            "activeCount": snapshot["activeSessionCount"],
            "activeUsers": snapshot["activeSessions"],
            "blockedUsers": snapshot["blockedUsers"],
        },
        "simulator": {
            "running": simulator.is_running,
            "targetUrl": simulator.theadx_url,
            "intervalSeconds": simulator.interval,
            "totalEventsSent": simulator.events_sent,
            "lastEventTime": simulator.last_event_time,
            "lastPushStatus": simulator.last_status,
            "lastError": simulator.last_error,
        },
        "availableUsers": [u["username"] for u in USERS],
    })


@app.route("/block-user", methods=["POST"])
def api_block_user():
    """Remotely block user session"""
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    if not username:
        return jsonify({"error": "username is required"}), 400

    res = block_user(username)
    return jsonify({
        "success": True,
        "message": f"User '{username}' session revoked and blocked on node",
        "result": res,
    })


@app.route("/unblock-user", methods=["POST"])
def api_unblock_user():
    """Unblock user session"""
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    if not username:
        return jsonify({"error": "username is required"}), 400

    res = unblock_user(username)
    return jsonify({
        "success": True,
        "message": f"User '{username}' unblocked",
        "result": res,
    })


@app.route("/simulate-attack", methods=["POST"])
def api_simulate_attack():
    """Trigger an on-demand attack scenario"""
    data = request.get_json(silent=True) or {}
    scenario = data.get("scenario", "unknown_ip")
    events = simulator.trigger_attack_scenario(scenario)
    return jsonify({
        "success": True,
        "scenario": scenario,
        "eventsGenerated": len(events),
        "events": events,
    })


def start_server():
    port = int(os.getenv("PORT", 5001))
    env = os.getenv("FLASK_ENV", "development")
    # Start simulator on boot unless in test environment
    if env != "test":
        simulator.start()
    app.run(host="0.0.0.0", port=port, debug=False)


if __name__ == "__main__":
    start_server()
