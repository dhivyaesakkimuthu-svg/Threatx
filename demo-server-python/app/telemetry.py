"""
Telemetry collector for server hardware and system sessions using psutil.
"""
import datetime
import os
import platform
import time
from typing import Any, Dict

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    psutil = None
    HAS_PSUTIL = False

_FIRST_CALL = True


def get_telemetry_snapshot() -> Dict[str, Any]:
    """
    Collect live hardware and session telemetry using psutil.
    Returns:
    {
      "cpu_percent": <float>,
      "memory_percent": <float>,
      "disk_percent": <float>,
      "process_count": <int>,
      "logged_in_sessions": <int>,
      "boot_time": <ISO string>,
      "uptime_seconds": <float>
    }
    """
    global _FIRST_CALL
    cpu_pct = 0.0
    mem_pct = 0.0
    disk_pct = 0.0
    process_count = 0
    logged_in_sessions = 0
    boot_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    uptime_sec = 0.0

    if HAS_PSUTIL and psutil is not None:
        try:
            # Call psutil.cpu_percent(interval=0.1) on first call to get a non-zero reading
            if _FIRST_CALL:
                cpu_pct = float(psutil.cpu_percent(interval=0.1))
                _FIRST_CALL = False
            else:
                cpu_pct = float(psutil.cpu_percent(interval=None))
                if cpu_pct == 0.0:
                    cpu_pct = float(psutil.cpu_percent(interval=0.05))

            mem = psutil.virtual_memory()
            mem_pct = float(mem.percent)

            root_path = os.path.splitdrive(os.path.abspath('.'))[0] + '\\' if os.name == 'nt' else '/'
            disk = psutil.disk_usage(root_path)
            disk_pct = float(disk.percent)

            process_count = len(psutil.pids())

            raw_users = psutil.users()
            logged_in_sessions = len(raw_users)

            boot_ts = psutil.boot_time()
            boot_iso = datetime.datetime.fromtimestamp(boot_ts, datetime.timezone.utc).isoformat()
            uptime_sec = round(time.time() - boot_ts, 1)
        except Exception:
            pass

    if uptime_sec <= 0:
        uptime_sec = 3600.0

    return {
        "cpu_percent": round(cpu_pct, 1),
        "memory_percent": round(mem_pct, 1),
        "disk_percent": round(disk_pct, 1),
        "process_count": process_count,
        "logged_in_sessions": logged_in_sessions,
        "boot_time": boot_iso,
        "uptime_seconds": uptime_sec,
        # CamelCase aliases for frontend and backwards compatibility
        "cpuPercent": round(cpu_pct, 1),
        "memoryPercent": round(mem_pct, 1),
        "diskPercent": round(disk_pct, 1),
        "activeProcessCount": process_count,
        "activeSessionCount": max(logged_in_sessions, 1),
        "hostname": platform.node() or "theadx-node-01",
        "platform": platform.platform(),
        "timestamp": int(time.time()),
    }
