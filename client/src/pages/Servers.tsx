import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server as ServerIcon, Trash2, Circle, Activity, AlertCircle, ExternalLink, Terminal, Cpu, Layers } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import { api } from '../api/client';
import type { Server } from '../types';

const statusColors = {
  online: 'text-emerald-400',
  offline: 'text-red-400',
  pending: 'text-amber-400',
};

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [threatCounts, setThreatCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<{
    demoServerRunning: boolean;
    agentConnected: boolean;
    targetUrl: string;
    targetMetrics: any;
  } | null>(null);
  const [mitigating, setMitigating] = useState(false);
  const [blockUserInput, setBlockUserInput] = useState('');
  const [mitigateMsg, setMitigateMsg] = useState<string | null>(null);

  const loadServersData = async () => {
    try {
      const [data, allEvents, statusData] = await Promise.all([
        api.getServers(),
        api.getEvents({ limit: 1000 }),
        api.getAgentStatus().catch(() => null),
      ]);
      setServers(data);
      if (statusData) setAgentStatus(statusData);

      const counts: Record<string, number> = {};
      allEvents.forEach((e) => {
        counts[e.serverId] = (counts[e.serverId] || 0) + 1;
      });
      setThreatCounts(counts);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServersData();
    const interval = setInterval(loadServersData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this server from monitoring infrastructure?')) return;
    await api.deleteServer(id);
    setServers((s) => s.filter((sv) => sv.id !== id));
  };

  const handleBlockUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockUserInput.trim()) return;
    setMitigating(true);
    setMitigateMsg(null);
    try {
      await api.blockDemoUser(blockUserInput.trim());
      setMitigateMsg(`Locked session for user "${blockUserInput.trim()}" on target server.`);
      setBlockUserInput('');
      loadServersData();
    } catch (err) {
      setMitigateMsg(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setMitigating(false);
    }
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

  if (loading && servers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Loading infrastructure nodes...
          </p>
        </div>
      </div>
    );
  }

  if (error && servers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2">Connection Lost</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); loadServersData(); }}
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
      <Header title="Infrastructure Monitor" subtitle="Manage connected server nodes and telemetry agents" />
      
      {/* Demo Target Server & Attack Simulator Banner */}
      <GlassCard className="border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-blue-950/40 to-slate-900/90 shadow-[0_0_30px_rgba(6,182,212,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Integrated Demo Environment
              </span>
              {agentStatus?.demoServerRunning ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Circle size={6} fill="currentColor" className="animate-pulse" /> Target Server Active (:5001)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                  <Circle size={6} fill="currentColor" /> Target Server Idle (:5001)
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              OmniCorp Target Server & Attack Simulator
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Real-time telemetry pipeline connecting <code className="text-cyan-300 font-mono">demo_server.py</code> (port 5001) and <code className="text-cyan-300 font-mono">theartx_agent.py</code> to the ThreatX AI engine. Launch the staff portal to trigger simulated attack scenarios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="http://localhost:5001"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-bold uppercase tracking-wider text-white hover:opacity-95 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <ExternalLink size={14} /> Open Simulator Portal
            </a>
            <Link
              to="/servers/add"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-blue-500/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Plus size={14} /> Add Server
            </Link>
          </div>
        </div>

        {/* Live Target Metrics & Remote Mitigation Bar */}
        {agentStatus?.demoServerRunning && agentStatus.targetMetrics && (
          <div className="mt-5 pt-4 border-t border-cyan-500/10 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-blue-500/10">
              <Cpu size={18} className="text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Target CPU Load</p>
                <p className="text-xs font-mono font-bold text-slate-200">{agentStatus.targetMetrics.cpu_usage_percent}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-blue-500/10">
              <Layers size={18} className="text-indigo-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Memory Usage</p>
                <p className="text-xs font-mono font-bold text-slate-200">{agentStatus.targetMetrics.memory_usage_percent}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-blue-500/10">
              <Activity size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Active SSH Sessions</p>
                <p className="text-xs font-mono font-bold text-slate-200">{agentStatus.targetMetrics.active_session_count} Connected</p>
              </div>
            </div>
            <form onSubmit={handleBlockUser} className="flex items-center gap-2">
              <input
                type="text"
                value={blockUserInput}
                onChange={(e) => setBlockUserInput(e.target.value)}
                placeholder="Lock user (e.g. alice)"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-red-500/20 text-xs text-slate-200 focus:outline-none focus:border-red-500/40 font-mono"
              />
              <button
                type="submit"
                disabled={mitigating}
                className="px-3 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
              >
                {mitigating ? '...' : 'Block'}
              </button>
            </form>
          </div>
        )}

        {mitigateMsg && (
          <p className="mt-3 text-xs font-semibold text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/20">
            {mitigateMsg}
          </p>
        )}

        {/* Quick Launch commands preview if server is not running */}
        {!agentStatus?.demoServerRunning && (
          <div className="mt-4 pt-3 border-t border-cyan-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-cyan-400" />
              <span>Start simulator: <code className="px-2 py-0.5 rounded bg-black/40 text-cyan-300 font-mono">python demo-server/demo_server.py</code></span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-indigo-400" />
              <span>Start agent: <code className="px-2 py-0.5 rounded bg-black/40 text-indigo-300 font-mono">python demo-server/theartx_agent.py</code></span>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-between items-center">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-200">Monitored Infrastructure Nodes ({servers.length})</h3>
        <Link
          to="/servers/add"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
        >
          <Plus size={14} /> Add Server
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
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      <ServerIcon size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 truncate max-w-[150px]">{server.name}</h3>
                      <p className="text-xs text-slate-400 font-mono tracking-tight">{server.hostname}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(server.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium uppercase text-[11px] tracking-wide">Node Status</span>
                    <span className={`flex items-center gap-1.5 capitalize font-semibold text-xs ${statusColors[server.status]}`}>
                      <Circle size={6} fill="currentColor" className="animate-pulse" /> {server.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium uppercase text-[11px] tracking-wide">Operating System</span>
                    <span className="text-slate-200 font-semibold">{server.os}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium uppercase text-[11px] tracking-wide">Internal IP</span>
                    <span className="text-slate-200 font-mono font-bold tabular-nums">{server.ipAddress || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium uppercase text-[11px] tracking-wide">Telemetry Agent</span>
                    <span className="text-slate-200 font-semibold flex items-center gap-1">
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
                    <span className="text-slate-400 font-medium uppercase text-[11px] tracking-wide">Last Telemetry Ping</span>
                    <span className="text-slate-300 font-semibold">{getRelativeTime(server.lastSeen)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-blue-500/5">
                    <span className="text-slate-400 font-medium uppercase text-[11px] tracking-wide">Detected Anomalies</span>
                    <span className={`font-bold tabular-nums ${threats > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {threats} Warnings
                    </span>
                  </div>
                </div>
              </div>

              {/* View events linking back */}
              <div className="mt-5 pt-3 border-t border-blue-500/5">
                <Link
                  to={`/threats`}
                  className="w-full inline-flex items-center justify-center py-2 rounded-xl bg-white/5 border border-blue-500/10 hover:bg-white/10 hover:border-blue-500/25 transition-all text-xs font-semibold text-slate-200"
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
          <ServerIcon size={40} className="mx-auto text-slate-500 mb-3" />
          <p className="text-slate-300 font-semibold mb-4">No server nodes mapped to the current dashboard environment</p>
          <Link to="/servers/add" className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-wider">
            Register Monitored Endpoint →
          </Link>
        </GlassCard>
      )}
    </div>
  );
}
