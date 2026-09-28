"""Simulated target server for cybersecurity testing.

Run with:
    pip install flask requests
    python demo_server.py

The service listens on port 5001 and exposes a small set of REST endpoints
for monitoring server health and generating synthetic security telemetry.
"""

from __future__ import annotations

import random
import threading
import time
from collections import deque
from datetime import datetime, timezone
import os
from flask import Flask, jsonify, request, send_file

from theartx_config import THEARTX_API_KEY

app = Flask(__name__)
PORTAL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "omnicorp_portal.html")

SERVER_PORT = 5001
USERNAMES = ["alice", "bob", "charlie", "diana", "eric", "frank", "grace"]
SENSITIVE_FILES = [
    "/etc/passwd",
    "/var/www/secrets/config.yaml",
    "/home/admin/finance/ledger.csv",
    "/tmp/customer_export.csv",
    "/srv/app/.env",
]
IP_ADDRESSES = [
    "10.0.0.12",
    "10.0.0.18",
    "192.168.1.24",
    "203.0.113.42",
    "54.87.33.11",
    "172.16.0.5",
]

state: Dict[str, Any] = {
    "server_health": "healthy",
    "connection_status": "connected",
    "cpu_usage": 36.2,
    "memory_usage": 58.7,
    "ssh_sessions": [
        {"username": "alice", "session_id": "ssh-1001", "source_ip": "10.0.0.12", "status": "active"},
        {"username": "bob", "session_id": "ssh-1002", "source_ip": "192.168.1.24", "status": "active"},
    ],
    "logs": deque(maxlen=500),
    "logs_queue": deque(maxlen=500),
}


def iso_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def create_event(event_type: str, username: str, source_ip: str, details: str, severity: str = "info") -> Dict[str, Any]:
    return {
        "timestamp": iso_timestamp(),
        "event_type": event_type,
        "username": username,
        "source_ip": source_ip,
        "severity": severity,
        "details": details,
    }


def add_log(event: Dict[str, Any]) -> None:
    state["logs"].append(event)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


def seed_state() -> None:
    initial_events = [
        create_event("ssh_login", "alice", "10.0.0.12", "User authenticated over SSH from trusted office network.", "info"),
        create_event("file_access", "bob", "192.168.1.24", "Accessed /var/log/nginx/access.log.", "info"),
        create_event("sensitive_download", "alice", "10.0.0.12", "Downloaded /srv/app/.env from /tmp directory.", "high"),
        create_event("impossible_travel", "charlie", "203.0.113.42", "Login from New York followed by login from Singapore within 20 minutes.", "critical"),
    ]
    for event in initial_events:
        add_log(event)


def generate_random_event() -> Dict[str, Any]:
    username = random.choice(USERNAMES)
    source_ip = random.choice(IP_ADDRESSES)

    if random.random() < 0.72:
        normal_actions = [
            ("ssh_login", "User authenticated via SSH session.", "info"),
            ("file_access", "Read a routine application log file.", "info"),
            ("file_access", f"Opened {random.choice(SENSITIVE_FILES)} for review.", "low"),
            ("sensitive_download", f"Downloaded {random.choice(SENSITIVE_FILES)} for support troubleshooting.", "medium"),
            ("user_activity", "Executed a standard system command from a valid shell.", "info"),
        ]
        event_type, details, severity = random.choice(normal_actions)
        return create_event(event_type, username, source_ip, details, severity)

    anomaly_actions = [
        ("failed_login", "Repeated failed SSH login attempts detected against the server.", "high"),
        ("failed_login", "Password spray activity observed against multiple accounts.", "high"),
        ("impossible_travel", "User appeared in multiple geographic locations within an implausible time window.", "critical"),
        ("sensitive_download", "Sensitive file was downloaded without a corresponding approval event.", "high"),
        ("credential_dump", "Attempted access to local credential stores was blocked by the endpoint.", "critical"),
    ]
    event_type, details, severity = random.choice(anomaly_actions)
    return create_event(event_type, username, source_ip, details, severity)


def refresh_session_state() -> None:
    # Maintain a lightweight set of active SSH sessions.
    if random.random() < 0.5 and len(state["ssh_sessions"]) < 12:
        username = random.choice(USERNAMES)
        state["ssh_sessions"].append(
            {
                "username": username,
                "session_id": f"ssh-{random.randint(1000, 9999)}",
                "source_ip": random.choice(IP_ADDRESSES),
                "status": "active",
            }
        )

    if random.random() < 0.35 and state["ssh_sessions"]:
        session_to_remove = random.choice(state["ssh_sessions"])
        session_to_remove["status"] = "closed"
        state["ssh_sessions"] = [
            session for session in state["ssh_sessions"] if session.get("status") == "active"
        ]

    state["cpu_usage"] = round(random.uniform(18, 88), 2)
    state["memory_usage"] = round(random.uniform(35, 92), 2)
    state["connection_status"] = "connected" if random.random() < 0.9 else "degraded"
    if state["connection_status"] == "degraded":
        state["server_health"] = "warning"
    else:
        state["server_health"] = "healthy"


def background_audit_loop() -> None:
    while True:
        event = generate_random_event()
        add_log(event)
        refresh_session_state()
        time.sleep(random.uniform(2, 6))


@app.route("/", methods=["GET"])
@app.route("/portal", methods=["GET"])
def serve_portal():
    if os.path.exists(PORTAL_PATH):
        return send_file(PORTAL_PATH)
    return jsonify({"status": "ok", "service": "OmniCorp Target Server", "port": SERVER_PORT})


@app.route("/api/status", methods=["GET"])
def api_status():
    return jsonify(
        {
            "server_health": state["server_health"],
            "cpu_usage_percent": state["cpu_usage"],
            "memory_usage_percent": state["memory_usage"],
            "active_session_count": len(state["ssh_sessions"]),
            "connection_status": state["connection_status"],
            "timestamp": iso_timestamp(),
        }
    )


@app.route("/api/logs", methods=["GET"])
def api_logs() -> Any:
    batch_size = 15
    new_logs = [generate_random_event() for _ in range(batch_size)]
    for event in new_logs:
        add_log(event)

    logs = list(state["logs"])[-batch_size:]
    return jsonify({"count": len(logs), "logs": logs})


@app.route("/api/action/block-user", methods=["POST", "OPTIONS"])
def block_user() -> Any:
    if request.method == "OPTIONS":
        return jsonify({}), 204

    payload = request.get_json(silent=True) or {}
    username = payload.get("username")

    if not username or not isinstance(username, str):
        return jsonify({"error": "A valid 'username' string is required."}), 400

    updated_sessions = []
    for session in state["ssh_sessions"]:
        if session.get("username") == username:
            session["status"] = "blocked"
            updated_sessions.append(session)
        else:
            updated_sessions.append(session)

    state["ssh_sessions"] = updated_sessions

    add_log(
        create_event(
            "user_blocked",
            username,
            "127.0.0.1",
            f"Administrator locked the active session for user '{username}'.",
            "high",
        )
    )

    return jsonify(
        {
            "status": "success",
            "username": username,
            "message": f"User '{username}' has been blocked and their session locked.",
            "timestamp": iso_timestamp(),
        }
    )


@app.route("/api/simulate/action", methods=["POST", "OPTIONS"])
def simulate_action() -> Any:
    if request.method == "OPTIONS":
        return jsonify({}), 204

    data = request.get_json(silent=True) or {}
    timestamp = data.get("timestamp") or iso_timestamp()
    event = {
        "timestamp": timestamp,
        "username": data.get("username", "anonymous"),
        "event_type": data.get("event_type", "FILE_ACCESS"),
        "ip_address": data.get("ip_address", "192.168.1.45"),
        "location": data.get("location", "New York, US"),
        "device": data.get("device", "Windows Chrome"),
        "details": data.get("details", "Standard activity"),
        "status": data.get("status", "success"),
    }

    auth_header = request.headers.get("Authorization", "")
    if auth_header and auth_header != f"Bearer {THEARTX_API_KEY}":
        return jsonify({"error": "Unauthorized", "message": "Invalid API key."}), 401

    state["logs_queue"].append(event)
    add_log(
        {
            "timestamp": timestamp,
            "event_type": event["event_type"],
            "username": event["username"],
            "source_ip": event["ip_address"],
            "severity": "high" if "CONFIDENTIAL" in event["details"].upper() or event["status"] == "failed" else "info",
            "details": event["details"],
        }
    )
    return jsonify({"status": "logged", "event": event})


@app.route("/api/simulate/login", methods=["POST", "OPTIONS"])
def simulate_login() -> Any:
    if request.method == "OPTIONS":
        return jsonify({}), 204

    auth_header = request.headers.get("Authorization", "")
    if auth_header and auth_header != f"Bearer {THEARTX_API_KEY}":
        return jsonify({"error": "Unauthorized", "message": "Invalid API key."}), 401

    data = request.get_json(silent=True) or {}
    username = data.get("user") or data.get("username") or "alice"
    success = data.get("status") != "failed"
    payload = {
        "timestamp": data.get("timestamp") or iso_timestamp(),
        "username": username,
        "event_type": "USER_LOGIN",
        "ip_address": data.get("ip_address", "203.0.113.22"),
        "location": data.get("location", "New York, US"),
        "device": data.get("device", "Windows Chrome"),
        "details": data.get("details", "User login succeeded.") if success else data.get("details", "Failed login attempt; invalid credentials."),
        "status": "success" if success else "failed",
    }
    state["logs_queue"].append(payload)
    add_log(
        {
            "timestamp": payload["timestamp"],
            "event_type": payload["event_type"],
            "username": payload["username"],
            "source_ip": payload["ip_address"],
            "severity": "high" if payload["status"] == "failed" else "info",
            "details": payload["details"],
        }
    )
    return jsonify({"status": "logged", "event": payload})


seed_state()
background_thread = threading.Thread(target=background_audit_loop, daemon=True)
background_thread.start()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=SERVER_PORT, debug=False)
