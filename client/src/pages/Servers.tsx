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
    <div className="space-y-6">
      <Topbar
        title="Infrastructure Monitor"
        subtitle="Manage connected server nodes, live telemetry and agent configurations"
      />

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E4E7EC] text-xs text-[#172033] transition-all font-semibold"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            Sync Cluster
          </button>
          <span className="text-xs text-[#667085] font-mono">
            {servers.length} Monitored Node{servers.length === 1 ? '' : 's'} Active
          </span>
        </div>

        <Link
          to="/servers/add"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all shadow-xs"
        >
          <Plus size={14} /> Add Monitored Server
        </Link>
      </div>

      {/* Server Grid */}
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
                className="cursor-pointer rounded-xl bg-white border border-[#E4E7EC] hover:border-blue-400 p-5 shadow-xs hover:shadow-md flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <ServerIcon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#172033] truncate max-w-[160px] text-sm">
                            {server.name}
                          </h3>
                          {isDemo && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Zap size={9} className="text-emerald-600" /> Live
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#667085] font-mono">{server.serverId || server.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDelete(server.id || server.serverId, e)}
                        className="p-1.5 text-[#667085] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Server"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-2 text-xs bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E4E7EC] mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#667085] font-medium text-[10px] uppercase tracking-wider">
                        IP Address
                      </span>
                      <span className="font-mono text-[#172033] text-xs font-bold">
                        {server.ipAddress || '127.0.0.1'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#667085] font-medium text-[10px] uppercase tracking-wider">
                        Health Status
                      </span>
                      <StatusBadge status={health} size="sm" />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#667085] font-medium text-[10px] uppercase tracking-wider">
                        Connection
                      </span>
                      <span className="capitalize font-mono text-[11px] text-[#172033] font-semibold">
                        {connection}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#667085] font-medium text-[10px] uppercase tracking-wider">
                        Last Heartbeat
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#667085]">
                        <Clock size={10} />
                        {getRelativeTime(heartbeat)}
                      </span>
                    </div>
                  </div>

                  {/* Resource Gauges */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC]">
                      <div className="flex justify-between items-center text-[10px] text-[#667085] font-mono mb-1">
                        <span className="flex items-center gap-1 font-sans font-medium">
                          <Cpu size={12} className="text-blue-600" /> CPU
                        </span>
                        <span className="font-bold text-[#172033]">{cpu}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, cpu))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC]">
                      <div className="flex justify-between items-center text-[10px] text-[#667085] font-mono mb-1">
                        <span className="flex items-center gap-1 font-sans font-medium">
                          <HardDrive size={12} className="text-teal-600" /> Memory
                        </span>
                        <span className="font-bold text-[#172033]">{memory}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, memory))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-between text-[11px] text-[#667085]">
                  <span>OS: {server.os || 'Linux'}</span>
                  <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                    Telemetry Drill-down <Eye size={12} />
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

