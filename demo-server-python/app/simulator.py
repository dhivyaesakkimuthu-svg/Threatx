"""
Telemetry simulation engine and background event pusher.
Runs in a background thread and posts events to TheadX ingest API every 7 seconds.
"""
import os
import time
import random
import threading
import datetime
import requests
import sys
from pathlib import Path
from typing import Dict, Any, List

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    from app.users import USERS
    from app.telemetry import is_user_blocked, get_telemetry_snapshot
except (ImportError, ValueError):
    from users import USERS
    from telemetry import is_user_blocked, get_telemetry_snapshot

SAFE_FILE_PATHS = [
    '/projects/report-2026.pdf',
    '/shared/team-notes.docx',
    '/finance/quarterly-summary.xlsx',
    '/documents/architecture-overview.pdf',
    '/marketing/campaign-q3.pptx',
    '/engineering/design-specs.md',
]

RESTRICTED_FILE_PATHS = [
    '/confidential/merger-plans.pdf',
    '/admin/secrets/credentials.key',
    '/hr/private/salaries.xlsx',
    '/confidential/customer-passwords.csv',
    '/admin/secrets/private_key.pem',
]

FOREIGN_LOCATIONS = [
    {'lat': 55.7558, 'lng': 37.6173, 'city': 'Moscow', 'country': 'RU', 'ip': '45.33.32.156'},
    {'lat': 35.6762, 'lng': 139.6503, 'city': 'Tokyo', 'country': 'JP', 'ip': '133.242.18.1'},
    {'lat': 51.5074, 'lng': -0.1278, 'city': 'London', 'country': 'GB', 'ip': '88.198.22.4'},
    {'lat': 39.9042, 'lng': 116.4074, 'city': 'Beijing', 'country': 'CN', 'ip': '185.220.101.5'},
    {'lat': 1.3521, 'lng': 103.8198, 'city': 'Singapore', 'country': 'SG', 'ip': '203.0.113.42'},
]

UNUSUAL_DEVICES = ['Unknown Linux', 'iPhone 15 Pro', 'Xiaomi Phone', 'Kali Linux Workstation', 'Android Pixel']


def generate_single_event(user: Dict[str, Any], is_anomaly: bool = False, attack_type: str = None) -> Dict[str, Any]:
    """Generate a single ingestible security event with attached telemetry"""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    username = user["username"]
    user_id = user["userId"]

    # Blocked user attempt
    if is_user_blocked(username):
        return {
            "username": username,
            "userId": user_id,
            "eventType": "login",
            "ipAddress": user["normalIp"],
            "device": user["normalDevice"],
            "location": user["normalLocation"],
            "success": False,
            "timestamp": now,
        }

    if not is_anomaly and not attack_type:
        event_type = random.choice(['login', 'logout', 'file_access', 'file_download'])
        is_file = event_type in ('file_access', 'file_download')
        return {
            "username": username,
            "userId": user_id,
            "eventType": event_type,
            "ipAddress": user["normalIp"],
            "device": user["normalDevice"],
            "location": user["normalLocation"],
            "filePath": random.choice(SAFE_FILE_PATHS) if is_file else None,
            "success": True,
            "timestamp": now,
            "telemetry": get_telemetry_snapshot(),
        }

    chosen_anomaly = attack_type or random.choice(['unknown_ip', 'new_device', 'impossible_travel', 'restricted_folder', 'failed_login'])

    if chosen_anomaly == 'unknown_ip':
        foreign = random.choice(FOREIGN_LOCATIONS)
        event = {
            "username": username,
            "userId": user_id,
            "eventType": "login",
            "ipAddress": foreign["ip"],
            "device": user["normalDevice"],
            "location": {"lat": foreign["lat"], "lng": foreign["lng"], "city": foreign["city"], "country": foreign["country"]},
            "success": True,
            "timestamp": now,
        }

    elif chosen_anomaly == 'new_device':
        device = random.choice(UNUSUAL_DEVICES)
        event = {
            "username": username,
            "userId": user_id,
            "eventType": "login",
            "ipAddress": user["normalIp"],
            "device": device,
            "location": user["normalLocation"],
            "success": True,
            "timestamp": now,
        }

    elif chosen_anomaly == 'impossible_travel':
        foreign = FOREIGN_LOCATIONS[0]
        event = {
            "username": username,
            "userId": user_id,
            "eventType": "login",
            "ipAddress": foreign["ip"],
            "device": "Unknown Linux",
            "location": {"lat": foreign["lat"], "lng": foreign["lng"], "city": foreign["city"], "country": foreign["country"]},
            "success": True,
            "timestamp": now,
        }

    elif chosen_anomaly == 'restricted_folder':
        event = {
            "username": username,
            "userId": user_id,
            "eventType": "file_access",
            "ipAddress": user["normalIp"],
            "device": user["normalDevice"],
            "location": user["normalLocation"],
            "filePath": random.choice(RESTRICTED_FILE_PATHS),
            "success": True,
            "timestamp": now,
        }

    else:
        event = {
            "username": username,
            "userId": user_id,
            "eventType": "failed_login",
            "ipAddress": user.get("suspiciousIp", "45.33.32.156"),
            "device": "Unknown Device",
            "location": user["normalLocation"],
            "success": False,
            "timestamp": now,
        }

    # Attach current live hardware & session telemetry snapshot
    event["telemetry"] = get_telemetry_snapshot()
    return event


class SimulatorDaemon:
    def __init__(self):
        self.theadx_url = os.getenv("THEADX_URL", "http://localhost:3001")
        self.api_key = os.getenv("API_KEY", "tx_demo_key_for_testing_only")
        self.interval = int(os.getenv("SIMULATION_INTERVAL", "7"))
        self.is_running = False
        self.thread = None
        self.events_sent = 0
        self.last_event_time = None
        self.last_status = "idle"
        self.last_error = None

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        print(f"[Python Simulator] Background telemetry loop running (pushing every {self.interval}s to {self.theadx_url})")

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        print("[Python Simulator] Stopped background loop")

    def _run_loop(self):
        while self.is_running:
            try:
                user = random.choice(USERS)
                # 95% normal, 5% anomaly as specified
                is_anomaly = random.random() < 0.05
                event = generate_single_event(user, is_anomaly=is_anomaly)
                self.push_event(event)
            except Exception as e:
                self.last_error = str(e)
                print(f"[Python Simulator] Error in loop: {e}")
            time.sleep(self.interval)

    def push_event(self, event: Dict[str, Any]) -> bool:
        """Post a generated telemetry event to TheadX ingest endpoint with Bearer auth"""
        url = f"{self.theadx_url.rstrip('/')}/api/events/ingest"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        try:
            res = requests.post(url, json=event, headers=headers, timeout=5)
            self.events_sent += 1
            self.last_event_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self.last_status = "ok" if res.status_code < 400 else f"error_{res.status_code}"
            return res.status_code < 400
        except Exception as e:
            self.last_status = "network_error"
            self.last_error = str(e)
            return False

    def trigger_attack_scenario(self, scenario: str) -> List[Dict[str, Any]]:
        target_user = USERS[0]
        results = []

        if scenario == 'credential_stuffing':
            for u in USERS:
                event = {
                    "username": u["username"],
                    "userId": u["userId"],
                    "eventType": "failed_login",
                    "ipAddress": "194.26.29.112",
                    "device": "Automated Script",
                    "location": {"lat": 55.75, "lng": 37.61, "city": "Moscow", "country": "RU"},
                    "success": False,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                }
                self.push_event(event)
                results.append(event)
                time.sleep(0.2)

        elif scenario == 'mass_download':
            for path in RESTRICTED_FILE_PATHS:
                event = {
                    "username": target_user["username"],
                    "userId": target_user["userId"],
                    "eventType": "file_download",
                    "ipAddress": target_user["normalIp"],
                    "device": target_user["normalDevice"],
                    "location": target_user["normalLocation"],
                    "filePath": path,
                    "success": True,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                }
                self.push_event(event)
                results.append(event)
                time.sleep(0.2)

        else:
            event = generate_single_event(target_user, is_anomaly=True, attack_type=scenario)
            self.push_event(event)
            results.append(event)

        return results


# Global simulator instance
simulator = SimulatorDaemon()
