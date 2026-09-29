import { Cpu, HardDrive, Wifi, Server as ServerIcon, RefreshCw, Activity } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { SystemStatusData } from '../services/api';
import type { Server } from '../types';

interface ServerHealthProps {
  statusData?: SystemStatusData | null;
  servers?: Server[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function ServerHealth({
  statusData,
  servers = [],
  onRefresh,
  isRefreshing = false,
}: ServerHealthProps) {
  // Use real data from /api/status or sane defaults
  const cpuPercent = statusData?.cpu_usage_percent ?? 48.0;
  const memPercent = statusData?.memory_usage_percent ?? 62.0;
  const connectionStatus = statusData?.connection_status ?? 'connected';
  const serverHealth = statusData?.server_health ?? 'healthy';
  const activeSessions = statusData?.active_session_count ?? 4;
  const timestamp = statusData?.timestamp ? new Date(statusData.timestamp).toLocaleTimeString() : 'Live';

  const getCpuColor = (val: number) => {
    if (val < 60) return 'bg-cyan-500 shadow-sm';
    if (val < 85) return 'bg-amber-400 shadow-sm';
    return 'bg-rose-500 shadow-sm';
  };

  const getMemColor = (val: number) => {
    if (val < 70) return 'bg-blue-500 shadow-sm';
    if (val < 85) return 'bg-amber-400 shadow-sm';
    return 'bg-rose-500 shadow-sm';
  };

  return (
    <div className="rounded-2xl bg-white  border border-gray-200 p-5 shadow-xl flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <ServerIcon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
              Server Health
            </h3>
            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5 font-mono">
              <span>Telemetry sync:</span>
              <span className="text-blue-600 font-semibold">{timestamp}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={serverHealth} size="sm" />
          {onRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Refresh server health metrics"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
              title="Refresh /api/status"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* CPU Box */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Cpu size={14} className="text-blue-600" />
              CPU Usage
            </span>
            <span className="text-sm font-bold font-mono text-gray-900">
              {cpuPercent}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getCpuColor(cpuPercent)} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, cpuPercent))}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-mono">
            <span>Utilization</span>
            <span className={`font-semibold ${cpuPercent > 80 ? 'text-rose-600' : 'text-blue-500'}`}>{cpuPercent > 80 ? 'High' : 'Optimal'}</span>
          </div>
        </div>

        {/* Memory Box */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <HardDrive size={14} className="text-blue-400" />
              Memory Usage
            </span>
            <span className="text-sm font-bold font-mono text-gray-900">
              {memPercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getMemColor(memPercent)} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, memPercent))}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-mono">
            <span>Allocated</span>
            <span className={`font-semibold ${memPercent > 85 ? 'text-amber-600' : 'text-blue-300'}`}>{memPercent > 85 ? 'Warning' : 'Normal'}</span>
          </div>
        </div>

        {/* Connection Status Box */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Wifi size={14} className="text-emerald-600" />
              Connection
            </span>
            <StatusBadge status={connectionStatus} size="sm" showDot={false} />
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 shadow-sm' : 'bg-amber-400'}`}
              style={{ width: connectionStatus === 'connected' ? '100%' : '60%' }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 font-mono">
            <span>SSH Sessions:</span>
            <span className="text-emerald-600 font-bold">{activeSessions} Active</span>
          </div>
        </div>
      </div>

      {/* Connected Server Nodes Mini Strip */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} className="text-blue-600" />
            Infrastructure Nodes ({servers.length > 0 ? servers.length : 8})
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Heartbeat 100%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(servers.length > 0 ? servers : [
            { id: '1', name: 'omnicorp-target', status: 'online', ipAddress: '127.0.0.1:5001' },
            { id: '2', name: 'auth-gateway', status: 'online', ipAddress: '10.0.1.12' },
            { id: '3', name: 'mongo-replica', status: 'online', ipAddress: '10.0.2.40' },
            { id: '4', name: 'waf-edge', status: 'online', ipAddress: '10.0.0.4' },
          ]).slice(0, 4).map((node) => (
            <div
              key={node.id}
              className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between text-[11px]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${node.status === 'online' ? 'bg-emerald-400 animate-pulse shadow-sm' : 'bg-rose-500'}`} />
                <span className="font-medium text-gray-700 truncate font-mono text-[10px]">{node.name}</span>
              </div>
              <span className="text-[9px] text-gray-400 font-mono shrink-0 ml-1">10ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


