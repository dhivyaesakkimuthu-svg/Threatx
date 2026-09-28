import { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  LogIn,
  Clock,
  Terminal,
  Activity,
  Shield,
  Cpu,
  RefreshCw,
  Bell,
  Database,
} from 'lucide-react';
import { api, type SecurityActivity } from '../services/api';
import { subscribeToActivities } from '../services/socket';
import EmptyState from './EmptyState';

interface ActivityFeedProps {
  activities?: SecurityActivity[];
  limit?: number;
  recentThreats?: any[];
  recentLogins?: any[];
}

export default function ActivityFeed({
  activities: propActivities,
  limit = 15,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<SecurityActivity[]>(propActivities || []);
  const [filter, setFilter] = useState<'all' | 'threats' | 'alerts' | 'sessions' | 'system'>('all');
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (propActivities) return;
    setLoading(true);
    try {
      const data = await api.getActivities({ limit, category: filter });
      if (Array.isArray(data)) {
        setActivities(data);
      } else if (data && (data as any).data) {
        setActivities((data as any).data);
      }
    } catch (e) {
      console.warn('Could not load activity feed:', e);
    } finally {
      setLoading(false);
    }
  }, [filter, limit, propActivities]);

  useEffect(() => {
    if (propActivities) {
      setActivities(propActivities);
    } else {
      fetchActivities();
    }
  }, [propActivities, fetchActivities]);

  useEffect(() => {
    const unsub = subscribeToActivities((newAct) => {
      setActivities((prev) => [newAct, ...prev.slice(0, 24)]);
    });

    return () => {
      unsub();
    };
  }, []);

  const filtered = activities.filter((act) => {
    if (filter === 'all') return true;
    const typeStr = (act.type || '').toLowerCase();
    const msgStr = (act.message || '').toLowerCase();

    if (filter === 'threats') {
      return (
        act.severity === 'critical' ||
        act.severity === 'high' ||
        typeStr.includes('threat') ||
        typeStr.includes('anomaly') ||
        typeStr.includes('attack') ||
        msgStr.includes('threat') ||
        msgStr.includes('attack')
      );
    }
    if (filter === 'alerts') {
      return typeStr.includes('alert') || msgStr.includes('alert');
    }
    if (filter === 'sessions') {
      return (
        typeStr.includes('login') ||
        typeStr.includes('auth') ||
        typeStr.includes('session') ||
        msgStr.includes('session') ||
        msgStr.includes('login')
      );
    }
    if (filter === 'system') {
      return (
        typeStr.includes('system') ||
        typeStr.includes('server') ||
        typeStr.includes('heartbeat') ||
        typeStr.includes('telemetry') ||
        typeStr.includes('backup') ||
        typeStr.includes('firewall') ||
        msgStr.includes('server') ||
        msgStr.includes('telemetry')
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getIcon = (type: string, severity: string, message: string) => {
    if (severity === 'critical' || severity === 'high') {
      return <ShieldAlert size={14} className="text-red-600" />;
    }
    const t = (type || '').toLowerCase();
    const m = (message || '').toLowerCase();

    if (t.includes('alert') || m.includes('alert')) {
      return <Bell size={14} className="text-amber-600" />;
    }
    if (t.includes('login') || t.includes('auth') || t.includes('session')) {
      return <LogIn size={14} className="text-blue-600" />;
    }
    if (t.includes('firewall') || t.includes('block')) {
      return <Shield size={14} className="text-red-600" />;
    }
    if (t.includes('telemetry') || t.includes('cpu') || t.includes('heartbeat')) {
      return <Cpu size={14} className="text-emerald-600" />;
    }
    if (t.includes('backup') || t.includes('database')) {
      return <Database size={14} className="text-indigo-600" />;
    }
    return <Terminal size={14} className="text-slate-600" />;
  };

  const getRelativeTime = (timestamp: string | Date) => {
    if (!timestamp) return 'Just now';
    const ms = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E7EC] mb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033] tracking-wide uppercase">
              Live Activity Timeline
            </h3>
            <p className="text-[11px] text-[#667085] font-mono">
              Chronological security audit events from MongoDB
            </p>
          </div>
        </div>

        {/* Filter Pills: All, Threats, Alerts, Sessions, System */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-[#E4E7EC] flex-wrap text-xs">
          {(['all', 'threats', 'alerts', 'sessions', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
                filter === mode
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-[#667085] hover:text-[#172033] hover:bg-slate-200/60'
              }`}
            >
              {mode}
            </button>
          ))}
          {!propActivities && (
            <button
              onClick={fetchActivities}
              className="p-1 text-[#667085] hover:text-blue-600 transition-colors"
              title="Refresh Activities"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1.5 custom-scrollbar flex-1">
        {filtered.length === 0 ? (
          <EmptyState
            title="No activity records"
            description="No recent security events matching the selected filter."
            onAction={fetchActivities}
            actionLabel="Refresh Feed"
          />
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id || item.activityId || idx}
              className="group p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] hover:bg-white hover:border-blue-300 transition-all flex items-start gap-3 shadow-2xs"
            >
              <div className="p-2 rounded-lg bg-white border border-[#E4E7EC] shrink-0 mt-0.5 shadow-2xs">
                {getIcon(item.type, item.severity, item.message)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#172033] truncate group-hover:text-blue-600 transition-colors">
                    {item.message}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {item.severity || 'info'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1 text-[10px] text-[#667085] font-mono">
                  <span className="truncate max-w-[200px]">
                    {item.source || 'ThreatX Sensor'}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock size={10} />
                    {getRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

