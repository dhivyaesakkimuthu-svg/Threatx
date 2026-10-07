import { useEffect, useState } from 'react';
import { Bell, Check, CheckSquare, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import RiskBadge from '../components/ui/RiskBadge';
import { api } from '../api/client';
import type { Alert } from '../types';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      console.error('[Alerts] fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    await api.markAlertRead(id);
    setAlerts((a) => a.map((al) => (al.id === id ? { ...al, read: true } : al)));
  };

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.read);
    await Promise.all(unread.map(a => api.markAlertRead(a.id)));
    setAlerts((a) => a.map((al) => ({ ...al, read: true })));
  };

  const unread = alerts.filter((a) => !a.read).length;

  // Group alerts by day
  const groupAlertsByDay = () => {
    const groups: Record<string, Alert[]> = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    alerts.forEach((alert) => {
      const date = new Date(alert.createdAt);
      if (date.toDateString() === today.toDateString()) {
        groups.Today.push(alert);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(alert);
      } else {
        groups.Older.push(alert);
      }
    });

    return groups;
  };

  const groupedAlerts = groupAlertsByDay();

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Loading alerts...
          </p>
        </div>
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2">Connection Lost</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchAlerts(); }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Alert Center"
        subtitle={`${unread} pending security notification${unread !== 1 ? 's' : ''}`}
      />

      <div className="flex justify-between items-center bg-slate-900/60 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 size={14} className="text-cyan-400" /> : <VolumeX size={14} />}
            Sound Alerts: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer"
          >
            <CheckSquare size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-6">
        {(Object.keys(groupedAlerts) as Array<keyof typeof groupedAlerts>).map((group) => {
          const list = groupedAlerts[group];
          if (list.length === 0) return null;

          return (
            <div key={group} className="space-y-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-200 border-b border-white/5 pb-2">
                {group} Notifications
              </h3>
              <div className="space-y-3">
                {list.map((alert) => (
                  <GlassCard key={alert.id} className={`border border-white/10 hover:border-blue-500/30 transition-all ${alert.read ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${alert.read ? 'bg-slate-800/60 text-slate-500 border border-slate-700/40' : 'bg-red-500/10 text-red-400 border border-red-500/20 threat-pulse-active'}`}>
                          <ShieldAlert size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4 className="font-semibold text-sm text-slate-100">{alert.title}</h4>
                            <RiskBadge level={alert.riskLevel} />
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mt-2">
                            Received · {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.read && (
                        <button
                          onClick={() => markRead(alert.id)}
                          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 transition-colors text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Check size={12} /> Read
                        </button>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <GlassCard className="text-center py-16 border border-white/5">
            <Bell size={40} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-300 font-semibold text-sm">Log clean. No security alerts pending.</p>
            <p className="text-xs text-slate-500 mt-1">Real-time surveillance active</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
