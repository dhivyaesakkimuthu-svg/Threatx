#!/usr/bin/env python3
"""Minimal temporary Theartx backend for validating the end-to-end polling flow.

Run:
    python mock_theartx_backend.py --api-key test-key-123
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
from typing import Any, Dict

from flask import Flask, jsonify, request

app = Flask(__name__)


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@app.route("/", methods=["GET"])
def index() -> Any:
    return jsonify({"service": "theartx-mock-backend", "status": "online", "timestamp": utc_timestamp()})


@app.route("/api/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok", "timestamp": utc_timestamp()})


@app.route("/api/agent/ingest", methods=["POST"])
def agent_ingest() -> Any:
    auth_header = request.headers.get("Authorization", "")
    api_key = args.api_key if args else ""

    if auth_header != f"Bearer {api_key}":
        return jsonify({"error": "Unauthorized", "message": "Invalid or missing API key."}), 401

    payload = request.get_json(silent=True) or {}
    print("[INFO] Received ingest payload:")
    print(payload)

    # Return a mitigation command to exercise the remote-action path in the agent.
    return jsonify(
        {
            "status": "accepted",
            "message": "Log batch accepted by mock Theartx backend.",
            "timestamp": utc_timestamp(),
            "mitigation_command": {"action": "block_user", "target": "alice"},
        }
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Minimal temporary Theartx backend for local testing.")
    parser.add_argument("--api-key", required=True, help="API key expected in Authorization: Bearer <API_KEY>")
    parser.add_argument("--port", type=int, default=5000, help="Port to bind the Flask app to")
    args = parser.parse_args()

    print(f"[INFO] Mock Theartx backend running on http://0.0.0.0:{args.port}")
    print(f"[INFO] Expecting Authorization header: Bearer {args.api_key}")
    app.run(host="0.0.0.0", port=args.port, debug=False)
