"""
Background simulation thread for ThreatX telemetry events.
Generates normal baseline events and simulated anomalies, pushing to /api/events/ingest.
"""
import datetime
import os
import random
import threading
import time
from pathlib import Path
import sys
from typing import Any, Dict, List

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    from app.users import USERS
    from app.telemetry import get_telemetry_snapshot
except (ImportError, ValueError):
    from users import USERS
    from telemetry import get_telemetry_snapshot

import requests

NORMAL_FILES = [
    '/projects/annual-report.pdf',
    '/projects/q3-roadmap.pdf',
    '/shared/team-sync-notes.docx',
    '/finance/quarterly-summary.xlsx',
    '/engineering/architecture-v2.pdf',
    '/marketing/brand-assets.docx',
]

RESTRICTED_FILES = [
    '/confidential/executive-compensation.pdf',
    '/admin/secrets/production.key',
    '/admin/secrets/master_token.pem',
    '/hr/private/salary_matrix.xlsx',
    '/confidential/acquisition-target.docx',
]

FOREIGN_LOCATIONS = [
    {"city": "Moscow", "country": "RU", "ip": "45.33.32.156", "lat": 55.7558, "lng": 37.6173},
    {"city": "Tokyo", "country": "JP", "ip": "133.242.18.1", "lat": 35.6762, "lng": 139.6503},
    {"city": "London", "country": "GB", "ip": "88.198.22.4", "lat": 51.5074, "lng": -0.1278},
    {"city": "Beijing", "country": "CN", "ip": "185.220.101.5", "lat": 39.9042, "lng": 116.4074},
]

ANOMALY_TYPES = [
    "unknown_ip",
    "new_device",
    "impossible_travel",
    "restricted_folder",
    "mass_download_burst",
    "brute_force_burst",
]


class Simulator:
    def __init__(self):
        self.theadx_url = os.getenv("THEADX_URL", "http://localhost:3001")
        self.api_key = os.getenv("DEMO_API_KEY", os.getenv("API_KEY", "tx_demo_key_for_testing_only"))
        self.interval = float(os.getenv("EVENT_INTERVAL", "7"))
        self.anomaly_rate = float(os.getenv("ANOMALY_RATE", "0.05"))
        self.is_running = False
        self.thread: threading.Thread | None = None
        self.events_sent = 0

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.is_running = False

    def _run_loop(self):
        while self.is_running:
            try:
                user = random.choice(USERS)
                is_anomaly = random.random() < self.anomaly_rate
                self.generate_and_push(user, is_anomaly=is_anomaly)
            except Exception as e:
                print(f"[PY-DEMO] ❌ Simulation loop error: {e}")
            time.sleep(self.interval)

    def generate_and_push(self, user: Dict[str, Any], is_anomaly: bool = False, force_anomaly_type: str | None = None) -> bool:
        telemetry = get_telemetry_snapshot()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        anomaly_type = force_anomaly_type if force_anomaly_type else (random.choice(ANOMALY_TYPES) if is_anomaly else None)

        events: List[Dict[str, Any]] = []

        if not anomaly_type:
            # Normal event
            event_type = random.choice(["login", "logout", "file_access", "file_download"])
            file_path = random.choice(NORMAL_FILES) if event_type in ["file_access", "file_download"] else None
            event = {
                "userId": user["userId"],
                "username": user["username"],
                "eventType": event_type,
                "ipAddress": user["normalIp"],
                "device": user["normalDevice"],
                "location": user["normalLocation"],
                "filePath": file_path,
                "success": True,
                "timestamp": now_iso,
                "telemetry": telemetry,
            }
            events.append(event)
        else:
            # Anomaly scenarios
            if anomaly_type == "unknown_ip":
                foreign = random.choice(FOREIGN_LOCATIONS)
                events.append({
                    "userId": user["userId"],
                    "username": user["username"],
                    "eventType": "login",
                    "ipAddress": foreign["ip"],
                    "device": user["normalDevice"],
                    "location": {"lat": foreign["lat"], "lng": foreign["lng"], "city": foreign["city"], "country": foreign["country"]},
                    "success": True,
                    "timestamp": now_iso,
                    "telemetry": telemetry,
                })

            elif anomaly_type == "new_device":
                device_name = random.choice(["Unknown Device", "iPhone 15 Pro", "Kali Linux Workstation"])
                events.append({
                    "userId": user["userId"],
                    "username": user["username"],
                    "eventType": "login",
                    "ipAddress": user["normalIp"],
                    "device": device_name,
                    "location": user["normalLocation"],
                    "success": True,
                    "timestamp": now_iso,
                    "telemetry": telemetry,
                })

            elif anomaly_type == "impossible_travel":
                foreign = random.choice(FOREIGN_LOCATIONS)
                events.append({
                    "userId": user["userId"],
                    "username": user["username"],
                    "eventType": "login",
                    "ipAddress": foreign["ip"],
                    "device": "Unknown Device",
                    "location": {"lat": foreign["lat"], "lng": foreign["lng"], "city": foreign["city"], "country": foreign["country"]},
                    "success": True,
                    "timestamp": now_iso,
                    "telemetry": telemetry,
                })

            elif anomaly_type == "restricted_folder":
                events.append({
                    "userId": user["userId"],
                    "username": user["username"],
                    "eventType": "file_access",
                    "ipAddress": user["normalIp"],
                    "device": user["normalDevice"],
                    "location": user["normalLocation"],
                    "filePath": random.choice(RESTRICTED_FILES),
                    "success": True,
                    "timestamp": now_iso,
                    "telemetry": telemetry,
                })

            elif anomaly_type == "mass_download_burst":
                for i in range(random.randint(5, 6)):
                    events.append({
                        "userId": user["userId"],
                        "username": user["username"],
                        "eventType": "file_download",
                        "ipAddress": user["normalIp"],
                        "device": user["normalDevice"],
                        "location": user["normalLocation"],
                        "filePath": f"/finance/reports/export_q{i+1}_full.xlsx",
                        "success": True,
                        "timestamp": now_iso,
                        "telemetry": telemetry,
                    })

            elif anomaly_type == "brute_force_burst":
                suspicious_ip = user.get("suspiciousIp", "45.33.32.156")
                for _ in range(random.randint(3, 4)):
                    events.append({
                        "userId": user["userId"],
                        "username": user["username"],
                        "eventType": "failed_login",
                        "ipAddress": suspicious_ip,
                        "device": "Unknown Device",
                        "location": user["normalLocation"],
                        "success": False,
                        "timestamp": now_iso,
                        "telemetry": telemetry,
                    })
            else:
                # Default fallback
                events.append({
                    "userId": user["userId"],
                    "username": user["username"],
                    "eventType": "login",
                    "ipAddress": user["normalIp"],
                    "device": "Unknown Device",
                    "location": user["normalLocation"],
                    "success": True,
                    "timestamp": now_iso,
                    "telemetry": telemetry,
                })

        return self.post_to_theadx(user["username"], events, is_anomaly=(anomaly_type is not None))

    def post_to_theadx(self, username: str, events: List[Dict[str, Any]], is_anomaly: bool = False) -> bool:
        url = f"{self.theadx_url.rstrip('/')}/api/events/ingest"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = events[0] if len(events) == 1 else {"agentVersion": "python-agent-1.0", "logs": events}

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=5)
            if res.status_code in [200, 201]:
                self.events_sent += len(events)
                data = res.json()
                threats_count = len(data.get("threats", []))
                event_str = f"{len(events)} event" if len(events) == 1 else f"{len(events)} events"
                if is_anomaly:
                    print(f"[PY-DEMO] 🚨 ANOMALY {username} → {event_str}, {threats_count} threats")
                else:
                    print(f"[PY-DEMO] ✅ normal {username} → {event_str}, {threats_count} threats")
                return True
            else:
                print(f"[PY-DEMO] ❌ push failed: HTTP {res.status_code} - {res.text}")
                return False
        except Exception as e:
            print(f"[PY-DEMO] ❌ push failed: {e}")
            return False


# Global simulator singleton
simulator = Simulator()
