#!/usr/bin/env python3
"""Theartx monitoring agent for the demo target server.

Usage:
    python theartx_agent.py --api-key YOUR_API_KEY
    python theartx_agent.py --theartx-url http://localhost:5000 --api-key YOUR_API_KEY
"""

from __future__ import annotations

import argparse
import json
import socket
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests

try:
    from theartx_config import THEARTX_API_KEY
except ImportError:
    THEARTX_API_KEY = "tx_227c2920cc9599872b69f6fcf5db4e7a877ff217a8476e0b"

LOCAL_TARGET_URL = "http://localhost:5001"
DEFAULT_THEARTX_URL = "http://localhost:3001"
REQUEST_TIMEOUT = 10


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_server_metadata() -> Dict[str, Any]:
    return {
        "hostname": socket.gethostname(),
        "platform": "python",
        "agent_name": "theartx-agent",
        "local_target_url": LOCAL_TARGET_URL,
        "status": "Active",
        "timestamp": utc_timestamp(),
    }


def post_json(url: str, data: Dict[str, Any], api_key: str) -> Optional[Dict[str, Any]]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, json=data, headers=headers, timeout=REQUEST_TIMEOUT)
        try:
            payload = response.json()
        except ValueError:
            payload = {"raw_response": response.text}

        if response.status_code >= 400:
            print(f"[WARN] Theartx returned HTTP {response.status_code} for {url}: {payload}")
            return None

        return payload
    except requests.exceptions.RequestException as exc:
        print(f"[WARN] Connection error while sending to {url}: {exc}")
        return None


def local_post_json(url: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        response = requests.post(url, json=data, timeout=REQUEST_TIMEOUT)
        try:
            payload = response.json()
        except ValueError:
            payload = {"raw_response": response.text}

        if response.status_code >= 400:
            print(f"[WARN] Local action failed for {url}: {payload}")
            return None

        return payload
    except requests.exceptions.RequestException as exc:
        print(f"[WARN] Connection error while calling local action {url}: {exc}")
        return None


def fetch_local_logs() -> List[Dict[str, Any]]:
    try:
        response = requests.get(f"{LOCAL_TARGET_URL}/api/logs", timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        payload = response.json()
        return payload.get("logs", [])
    except requests.exceptions.RequestException as exc:
        print(f"[WARN] Could not fetch logs from local target: {exc}")
        return []


def handle_mitigation_response(response_payload: Optional[Dict[str, Any]], api_key: str, theartx_url: str) -> None:
    if not response_payload:
        return

    mitigation = response_payload.get("mitigation_command")
    if not mitigation:
        return

    action = mitigation.get("action")
    target = mitigation.get("target")

    if action == "block_user" and target:
        print(f"[INFO] Received mitigation: block_user for {target}")
        local_post_json(
            f"{LOCAL_TARGET_URL}/api/action/block-user",
            {"username": target},
        )
    else:
        print(f"[INFO] Ignored unsupported mitigation command: {mitigation}")


def send_heartbeat(theartx_url: str, api_key: str) -> Optional[Dict[str, Any]]:
    payload = {
        "event_type": "agent_heartbeat",
        "status": "Active",
        "server": build_server_metadata(),
        "timestamp": utc_timestamp(),
    }
    return post_json(f"{theartx_url}/api/agent/ingest", payload, api_key)


def send_log_batch(theartx_url: str, api_key: str, events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not events:
        print("[INFO] No new logs available from local server.")
        return None

    payload = {
        "event_type": "agent_log_batch",
        "server": build_server_metadata(),
        "timestamp": utc_timestamp(),
        "events": events,
    }

    response = post_json(f"{theartx_url}/api/agent/ingest", payload, api_key)
    if response:
        print(f"[INFO] Sent {len(events)} logs to Theartx")
    return response


def main() -> None:
    parser = argparse.ArgumentParser(description="Monitor the local demo server and stream logs to Theartx.")
    parser.add_argument("--theartx-url", default=DEFAULT_THEARTX_URL, help="Base URL for Theartx backend (default: http://localhost:3001)")
    parser.add_argument("--api-key", default=THEARTX_API_KEY, help="API key used for Theartx authentication")
    args = parser.parse_args()

    print(f"[INFO] Starting Theartx agent for {LOCAL_TARGET_URL}")
    print(f"[INFO] Theartx backend: {args.theartx_url}")

    heartbeat_response = send_heartbeat(args.theartx_url, args.api_key)
    if heartbeat_response:
        print("[INFO] Initial agent heartbeat sent successfully.")
    else:
        print("[WARN] Initial heartbeat failed; continuing to polling loop.")

    while True:
        events = fetch_local_logs()
        if events:
            response = send_log_batch(args.theartx_url, args.api_key, events)
            handle_mitigation_response(response, args.api_key, args.theartx_url)
        else:
            print("[INFO] No logs retrieved from local target. Waiting for next cycle...")

        time.sleep(5)


if __name__ == "__main__":
    main()
