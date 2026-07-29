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

  const fetchAlerts = () => {
    api.getAlerts().then(setAlerts).catch(console.error);
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

  return (
    <div className="space-y-6">
      <Header
        title="Alert Center"
        subtitle={`${unread} pending security notification${unread !== 1 ? 's' : ''}`}
      />

      <div className="flex justify-between items-center bg-white/5 border border-blue-500/10 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            {soundEnabled ? <Volume2 size={14} className="text-cyan-400" /> : <VolumeX size={14} />}
            Sound Alerts: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15"
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
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 border-b border-blue-500/5 pb-1">
                {group} Notifications
              </h3>
              <div className="space-y-3">
                {list.map((alert) => (
                  <GlassCard key={alert.id} className={`border border-blue-500/10 hover:border-blue-500/20 transition-all ${alert.read ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${alert.read ? 'bg-slate-500/10 text-slate-500' : 'bg-red-500/10 text-red-400 threat-pulse-active'}`}>
                          <ShieldAlert size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-200">{alert.title}</h4>
                            <RiskBadge level={alert.riskLevel} />
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{alert.message}</p>
                          <p className="text-[9px] text-slate-600 font-bold uppercase mt-1.5">
                            Received · {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.read && (
                        <button
                          onClick={() => markRead(alert.id)}
                          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 transition-colors text-slate-300"
                        >
                          <Check size={11} /> Read
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
          <GlassCard className="text-center py-16 border border-blue-500/10">
            <Bell size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400 font-bold">Log clean. No security alerts pending.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
