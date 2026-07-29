import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server as ServerIcon, Trash2, Circle, Activity, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import { api } from '../api/client';
import type { Server, ThreatEvent } from '../types';

const statusColors = {
  online: 'text-emerald-400',
  offline: 'text-red-400',
  pending: 'text-amber-400',
};

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [threatCounts, setThreatCounts] = useState<Record<string, number>>({});

  const loadServersData = async () => {
    try {
      const data = await api.getServers();
      setServers(data);
      
      const allEvents = await api.getEvents({ limit: 1000 });
      const counts: Record<string, number> = {};
      allEvents.forEach((e) => {
        counts[e.serverId] = (counts[e.serverId] || 0) + 1;
      });
      setThreatCounts(counts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadServersData();
    const interval = setInterval(loadServersData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this server from monitoring infrastructure?')) return;
    await api.deleteServer(id);
    setServers((s) => s.filter((sv) => sv.id !== id));
  };

  // Helper for relative seen time
  const getRelativeTime = (isoString: string) => {
    const ms = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Header title="Infrastructure Monitor" subtitle="Manage connected server nodes and agent status" />
      
      <div className="flex justify-end">
        <Link
          to="/servers/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
        >
          <Plus size={14} /> Add Monitored Server
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {servers.map((server) => {
          const threats = threatCounts[server.id] || 0;
          return (
            <GlassCard key={server.id} className="border border-blue-500/10 hover:border-blue-500/25 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      <ServerIcon size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-200 truncate max-w-[150px]">{server.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono tracking-tight">{server.hostname}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(server.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Node Status</span>
                    <span className={`flex items-center gap-1.5 capitalize font-bold text-xs ${statusColors[server.status]}`}>
                      <Circle size={6} fill="currentColor" className="animate-pulse" /> {server.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Operating System</span>
                    <span className="text-slate-300 font-semibold">{server.os}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Internal IP</span>
                    <span className="text-slate-300 font-mono font-bold">{server.ipAddress || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Telemetry Agent</span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      {server.agentVersion ? (
                        <>
                          <Activity size={12} className="text-emerald-400" />
                          v{server.agentVersion}
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-amber-400" />
                          Not Installed
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Last Telemetry Ping</span>
                    <span className="text-slate-400 font-bold">{getRelativeTime(server.lastSeen)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-blue-500/5">
                    <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Detected Anomalies</span>
                    <span className={`font-extrabold ${threats > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {threats} Warnings
                    </span>
                  </div>
                </div>
              </div>

              {/* View events linking back */}
              <div className="mt-5 pt-3 border-t border-blue-500/5">
                <Link
                  to={`/threats`}
                  className="w-full inline-flex items-center justify-center py-2 rounded-xl bg-white/5 border border-blue-500/10 hover:bg-white/10 hover:border-blue-500/25 transition-all text-xs font-bold text-slate-300"
                >
                  Inspect Server Logs
                </Link>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {servers.length === 0 && (
        <GlassCard className="text-center py-16 border border-blue-500/10">
          <ServerIcon size={40} className="mx-auto text-slate-700 mb-3 animate-bounce" />
          <p className="text-slate-400 font-bold mb-4">No server nodes mapped to the current dashboard environment</p>
          <Link to="/servers/add" className="text-blue-400 hover:text-blue-300 text-xs font-extrabold uppercase tracking-wider">
            Register Monitored Endpoint →
          </Link>
        </GlassCard>
      )}
    </div>
  );
}
