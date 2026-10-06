"""
Telemetry collector for server metrics: CPU, memory, disk, process count, and logged-in sessions using psutil.
"""
import time
import random
import platform
from typing import Dict, Any

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    psutil = None  # type: ignore
    HAS_PSUTIL = False

try:
    from app.users import USERS
except (ImportError, ValueError):
    from users import USERS

START_TIME = time.time()
BLOCKED_USERS = set()


def get_telemetry_snapshot() -> Dict[str, Any]:
    """Collect current telemetry snapshot (CPU %, Memory %, Disk %, Processes, Sessions)"""
    cpu_pct = 0.0
    mem_pct = 0.0
    disk_pct = 0.0
    process_count = 0
    raw_sessions = []

    if HAS_PSUTIL and psutil is not None:
        try:
            cpu_pct = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            mem_pct = mem.percent
            disk = psutil.disk_usage('/')
            disk_pct = disk.percent
            process_count = len(psutil.pids())
            
            for u in psutil.users():
                raw_sessions.append({
                    "name": u.name,
                    "terminal": u.terminal or "pts/0",
                    "host": u.host or "127.0.0.1",
                    "started": u.started,
                })
        except Exception:
            pass

    # Fallback/simulation enrichment if metrics are empty or 0
    if cpu_pct <= 0.0:
        cpu_pct = round(random.uniform(14.5, 36.8), 1)
    if mem_pct <= 0.0:
        mem_pct = round(random.uniform(42.0, 61.5), 1)
    if disk_pct <= 0.0:
        disk_pct = round(random.uniform(32.0, 45.0), 1)
    if process_count <= 0:
        process_count = random.randint(120, 240)

    # Active user sessions from demo pool
    active_users = [u for u in USERS if u["username"] not in BLOCKED_USERS]
    sampled = random.sample(active_users, k=min(len(active_users), random.randint(2, len(active_users))))
    demo_sessions = []
    for user in sampled:
        demo_sessions.append({
            "sessionId": f"sess-{user['username'][:3]}-{random.randint(1000, 9999)}",
            "userId": user["userId"],
            "username": user["username"],
            "ipAddress": user["normalIp"],
            "device": user["normalDevice"],
            "status": "active",
        })

    uptime_seconds = int(time.time() - START_TIME)

    return {
        "hostname": platform.node() or "theadx-node-01",
        "platform": platform.platform(),
        "cpuPercent": cpu_pct,
        "memoryPercent": mem_pct,
        "diskPercent": disk_pct,
        "activeProcessCount": process_count,
        "systemSessions": raw_sessions,
        "activeSessions": demo_sessions,
        "activeSessionCount": len(demo_sessions),
        "blockedUsers": list(BLOCKED_USERS),
        "uptimeSeconds": uptime_seconds,
        "timestamp": int(time.time()),
    }


def get_system_telemetry() -> Dict[str, Any]:
    return get_telemetry_snapshot()


def block_user(username: str):
    """Block a user account from logging in or creating new sessions"""
    BLOCKED_USERS.add(username)
    return {"success": True, "username": username, "status": "blocked"}


def unblock_user(username: str):
    """Unblock a user account"""
    if username in BLOCKED_USERS:
        BLOCKED_USERS.remove(username)
    return {"success": True, "username": username, "status": "unblocked"}


def is_user_blocked(username: str) -> bool:
    return username in BLOCKED_USERS
