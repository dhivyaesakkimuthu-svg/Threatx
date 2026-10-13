"""Simulated target server for cybersecurity testing.

Run with:
    pip install flask requests
    python demo_server.py

The service listens on port 5001 and exposes a small set of REST endpoints
for monitoring server health and generating synthetic security telemetry.
"""

from __future__ import annotations

import random
import re
import threading
import time
from collections import deque
from datetime import datetime, timezone
import os
from urllib.parse import unquote
import requests
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request, send_file
from werkzeug.exceptions import HTTPException

from theartx_config import THEARTX_API_KEY

load_dotenv()
app = Flask(__name__)
PORTAL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "omnicorp_portal.html")

SERVER_PORT = int(os.getenv("PORT", "5001"))
SECURITY_BACKEND_URL = os.getenv("SECURITY_BACKEND_URL", "http://localhost:4000").rstrip("/")
SECURITY_INGEST_TOKEN = os.getenv("SECURITY_INGEST_TOKEN", "")
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
not_found_by_ip: Dict[str, deque] = {}


def send_security_event(event_type: str, username: str, details: str, **extra: Any) -> Any:
    if not SECURITY_INGEST_TOKEN:
        return None
    payload = {
        "sourceIp": extra.pop("sourceIp", None) or request.remote_addr or "unknown",
        "username": username or "unknown",
        "eventType": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "details": details[:1000],
        **extra,
    }
    try:
        response = requests.post(
            f"{SECURITY_BACKEND_URL}/api/security/events",
            json=payload,
            headers={"Authorization": f"Bearer {SECURITY_INGEST_TOKEN}"},
            timeout=1,
        )
        if not response.ok:
            app.logger.warning("Security event delivery rejected (%s): %s", response.status_code, response.text[:500])
            response.raise_for_status()
        return response.json()
    except requests.RequestException as error:
        app.logger.warning("Security event delivery failed: %s", error)
    return None


def suspicious_request_flags() -> list[str]:
    raw = unquote(f"{request.path} {request.query_string.decode(errors='ignore')} {request.get_data(cache=True, as_text=True)}").lower()
    flags = []
    if re.search(r"(?:'|%27)\s*(?:or|and)\s+\d+\s*=\s*\d+|union\s+select|select.+from|sleep\s*\(", raw):
        flags.append("injection")
    if "../" in raw or "..\\" in raw or "%2e%2e" in raw:
        flags.append("path_traversal")
    return flags


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
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CLIENT_ORIGIN", "http://localhost:5173")
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    assessment = getattr(g, "security_assessment", None)
    if assessment and assessment.get("threatLevel"):
        response.headers["X-Threat-Level"] = assessment["threatLevel"]
    if response.status_code >= 400:
        source_ip = request.remote_addr or "unknown"
        flags = []
        if response.status_code == 404:
            attempts = not_found_by_ip.setdefault(source_ip, deque())
            now = time.time()
            attempts.append(now)
            while attempts and now - attempts[0] > 120:
                attempts.popleft()
            if len(attempts) >= 5:
                flags.append("route_scan")
        g.security_assessment = send_security_event(
            "http_error",
            request.args.get("username", "unknown"),
            f"HTTP {response.status_code} on {request.path}",
            path=request.path,
            statusCode=response.status_code,
            flags=flags,
        )
    return response


@app.before_request
def inspect_request():
    flags = suspicious_request_flags()
    if flags:
        g.security_assessment = send_security_event(
            "suspicious_request",
            request.args.get("username", "unknown"),
            "Suspicious request pattern: " + ", ".join(flags),
            path=request.path,
            flags=flags,
        )


@app.errorhandler(Exception)
def handle_server_exception(error):
    if isinstance(error, HTTPException):
        return error
    app.logger.exception("Unhandled demo-server exception")
    send_security_event("server_exception", "unknown", f"Unhandled {type(error).__name__}: {error}", path=request.path)
    return jsonify({"error": "Internal server error"}), 500


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
    login_flags = []
    if success and (datetime.now().hour < 6 or datetime.now().hour > 22):
        login_flags.append("odd_hour")
    assessment = send_security_event(
        "login_success" if success else "failed_login",
        username,
        payload["details"],
        sourceIp=payload["ip_address"],
        flags=login_flags,
    )
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
    return jsonify({"status": "logged", "event": payload, "assessment": assessment})


@app.route("/api/simulate/attack", methods=["POST"])
def simulate_attack() -> Any:
    """Send the requested LOW, HIGH, and CRITICAL scenarios through the real ingest path."""
    if not SECURITY_INGEST_TOKEN:
        return jsonify({"error": "SECURITY_INGEST_TOKEN is not configured."}), 503

    username = f"attack-test-{int(time.time() * 1000)}"
    assessments = []
    source_ip = "198.51.100.14"
    assessment = send_security_event("failed_login", username, "Single failed password attempt.", sourceIp=source_ip)
    assessments.append(assessment or {})

    for attempt in range(6):
        assessment = send_security_event(
            "failed_login",
            username,
            f"Rapid failed password attempt {attempt + 1} of 6.",
            sourceIp=source_ip,
        )
        assessments.append(assessment or {})

    assessment = send_security_event(
        "suspicious_request",
        username,
        "Test SQL injection pattern detected in request.",
        sourceIp=source_ip,
        path="/api/search?q=union+select",
        flags=["injection"],
    )
    assessments.append(assessment or {})
    levels = [
        assessments[0].get("threatLevel"),
        assessments[6].get("threatLevel"),
        assessments[7].get("threatLevel"),
    ]
    return jsonify({"success": all(assessments), "levels": levels, "events": assessments})


seed_state()
background_thread = threading.Thread(target=background_audit_loop, daemon=True)
background_thread.start()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=SERVER_PORT, debug=False)
