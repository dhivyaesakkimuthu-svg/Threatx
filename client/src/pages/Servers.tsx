import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Server as ServerIcon,
  Trash2,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  Eye,
  Zap,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ServerDrilldownModal from '../components/ServerDrilldownModal';
import { api, type SystemStatusData } from '../services/api';
import { subscribeToTelemetry } from '../services/socket';
import type { Server } from '../types';

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [demoStatus, setDemoStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [serversList, statusData] = await Promise.all([
        api.getServers(),
        api.getStatus().catch(() => null),
      ]);
      setServers(serversList || []);
      setDemoStatus(statusData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch monitored infrastructure');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to live telemetry
    const unsub = subscribeToTelemetry((telemetry) => {
      setDemoStatus(telemetry);
      setServers((prev) =>
        prev.map((s) => {
          if (s.serverId === 'SRV-001' || s.ipAddress === '127.0.0.1') {
            return {
              ...s,
              cpuUsage: telemetry.cpu_usage_percent,
              memoryUsage: telemetry.memory_usage_percent,
              health: telemetry.server_health as any,
              connectionStatus: telemetry.connection_status as any,
              activeSessions: telemetry.active_session_count,
              lastHeartbeat: telemetry.timestamp,
            };
          }
          return s;
        })
      );
    });

    const interval = setInterval(loadData, 10000);

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [loadData]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this server node from monitoring infrastructure?')) return;
    try {
      await api.deleteServer(id);
      setServers((prev) => prev.filter((s) => s.id !== id && s.serverId !== id));
      if (selectedServer?.id === id || selectedServer?.serverId === id) {
        setSelectedServer(null);
      }
    } catch (err: any) {
      alert(`Error deleting server: ${err.message}`);
    }
  };

  const handleInspect = async (server: Server) => {
    try {
      const details = await api.getServer(server.id || server.serverId);
      setSelectedServer(details);
    } catch {
      setSelectedServer(server);
    }
  };

  const getRelativeTime = (isoString: string | Date | undefined) => {
    if (!isoString) return 'Just now';
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
      <div className="space-y-6">
        <Topbar title="Infrastructure Monitor" subtitle="Connecting to central cluster..." />
        <LoadingState />
      </div>
    );
  }

  if (error && servers.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="Infrastructure Monitor" connectionStatus="offline" />
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Infrastructure Monitor"
        subtitle="Manage connected server nodes, live telemetry and agent configurations"
      />

      {/* Action Header - Dark Cybersecurity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-200  shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 hover:text-gray-900 transition-all font-bold cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            Sync Cluster
          </button>
          <span className="text-xs text-gray-500 font-mono">
            <strong className="text-gray-900">{servers.length}</strong> Monitored Node{servers.length === 1 ? '' : 's'} Active
          </span>
        </div>

        <Link
          to="/servers/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-bold text-gray-900 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> Add Monitored Server
        </Link>
      </div>

      {/* Server Grid - Dark Theme */}
      {servers.length === 0 ? (
        <EmptyState
          title="No servers registered"
          description="Click 'Add Monitored Server' to onboard your first target system or agent."
          actionLabel="Refresh Infrastructure"
          onAction={loadData}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server) => {
            const isDemo =
              server.serverId === 'SRV-001' ||
              server.ipAddress === '127.0.0.1' ||
              server.name.toLowerCase().includes('demo');

            const cpu = isDemo && demoStatus ? demoStatus.cpu_usage_percent : server.cpuUsage ?? 48;
            const memory = isDemo && demoStatus ? demoStatus.memory_usage_percent : server.memoryUsage ?? 62;
            const health = isDemo && demoStatus ? demoStatus.server_health : server.health || 'healthy';
            const connection = isDemo && demoStatus ? demoStatus.connection_status : server.connectionStatus || 'connected';
            const heartbeat = isDemo && demoStatus ? demoStatus.timestamp : server.lastHeartbeat || server.lastSeen;

            return (
              <div
                key={server.id || server.serverId}
                onClick={() => handleInspect(server)}
                className="cursor-pointer rounded-2xl bg-white border border-gray-200 hover:border-cyan-500/50 p-5 shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between transition-all group "
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-300 text-blue-600 group-hover:bg-blue-50 transition-colors">
                        <ServerIcon size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 truncate max-w-[160px] text-sm tracking-wide">
                            {server.name}
                          </h3>
                          {isDemo && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-500/40 flex items-center gap-1 font-mono">
                              <Zap size={10} className="text-emerald-600 animate-pulse" /> Live
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{server.serverId || server.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDelete(server.id || server.serverId, e)}
                        className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Remove Server"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-2.5 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">
                        IP Address
                      </span>
                      <span className="font-mono text-blue-500 text-xs font-bold">
                        {server.ipAddress || '127.0.0.1'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">
                        Health Status
                      </span>
                      <StatusBadge status={health} size="sm" />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">
                        Connection
                      </span>
                      <span className="capitalize font-mono text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {connection}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">
                        Last Heartbeat
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-gray-500">
                        <Clock size={12} className="text-blue-600" />
                        {getRelativeTime(heartbeat)}
                      </span>
                    </div>
                  </div>

                  {/* Resource Gauges */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mb-1.5">
                        <span className="flex items-center gap-1 font-sans font-bold text-gray-600">
                          <Cpu size={13} className="text-blue-600" /> CPU
                        </span>
                        <span className="font-black text-blue-500 font-mono text-xs">{cpu}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full shadow-sm"
                          style={{ width: `${Math.min(100, Math.max(0, cpu))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mb-1.5">
                        <span className="flex items-center gap-1 font-sans font-bold text-gray-600">
                          <HardDrive size={13} className="text-teal-400" /> Memory
                        </span>
                        <span className="font-black text-teal-300 font-mono text-xs">{memory}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 rounded-full shadow-sm"
                          style={{ width: `${Math.min(100, Math.max(0, memory))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono">OS: {server.os || 'Linux Ubuntu'}</span>
                  <span className="text-blue-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex items-center gap-1 font-bold">
                    Drill-down <Eye size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Server Drilldown & Live Performance Modal */}
      <ServerDrilldownModal
        server={selectedServer}
        onClose={() => setSelectedServer(null)}
      />
    </div>
  );
}
