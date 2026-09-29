import { useEffect, useState } from 'react';
import {
  Server as ServerIcon,
  X,
  Cpu,
  HardDrive,
  Users,
  Key,
  Activity,
  Radio,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatusBadge from './StatusBadge';
import { api, type ServerTelemetryRecord, type SystemStatusData } from '../services/api';
import { subscribeToTelemetry } from '../services/socket';
import type { Server } from '../types';

interface ServerDrilldownModalProps {
  server: Server | null;
  onClose: () => void;
}

export default function ServerDrilldownModal({
  server,
  onClose,
}: ServerDrilldownModalProps) {
  const [telemetryHistory, setTelemetryHistory] = useState<ServerTelemetryRecord[]>([]);
  const [liveMetrics, setLiveMetrics] = useState({
    cpu: server?.cpuUsage ?? 48,
    memory: server?.memoryUsage ?? 62,
    sessions: (server as any)?.activeSessions ?? 4,
    health: server?.health || 'healthy',
    connection: server?.connectionStatus || 'connected',
    lastHeartbeat: server?.lastHeartbeat || server?.lastSeen || new Date().toISOString(),
  });

  const serverId = server?.serverId || server?.id || 'SRV-001';

  // Fetch telemetry history on mount
  useEffect(() => {
    if (!server) return;

    let isMounted = true;

    api
      .getServerTelemetry(serverId, 25)
      .then((records: ServerTelemetryRecord[]) => {
        if (!isMounted) return;
        setTelemetryHistory(records || []);
      })
      .catch((err: any) => {
        console.warn('Failed to load telemetry history:', err);
      });

    // Subscribe to live telemetry updates
    const unsub = subscribeToTelemetry((telemetry: SystemStatusData) => {
      if (!isMounted) return;
      setLiveMetrics({
        cpu: telemetry.cpu_usage_percent,
        memory: telemetry.memory_usage_percent,
        sessions: telemetry.active_session_count,
        health: telemetry.server_health as any,
        connection: telemetry.connection_status as any,
        lastHeartbeat: telemetry.timestamp,
      });

      // Append new data point to chart
      setTelemetryHistory((prev) => {
        const newPoint: ServerTelemetryRecord = {
          serverId,
          cpuUsage: telemetry.cpu_usage_percent,
          memoryUsage: telemetry.memory_usage_percent,
          activeSessions: telemetry.active_session_count,
          health: telemetry.server_health,
          connectionStatus: telemetry.connection_status,
          timestamp: telemetry.timestamp,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-25);
      });
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [server, serverId]);

  if (!server) return null;

  const chartData = telemetryHistory.map((item, idx) => {
    const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `T-${idx}`;
    return {
      time: timeStr,
      cpu: item.cpuUsage,
      memory: item.memoryUsage,
      sessions: item.activeSessions,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-4xl rounded-2xl bg-white border border-[#E4E7EC] p-6 shadow-lg space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E4E7EC]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <ServerIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{serverId}</span>
                <StatusBadge status={liveMetrics.health} size="sm" />
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Zap size={10} className="text-emerald-600" /> Live Telemetry Synced
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#172033]">{server.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Gauges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC]">
            <div className="flex items-center justify-between text-[#667085] text-xs mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Cpu size={14} className="text-blue-600" /> CPU LOAD
              </span>
              <span className="font-bold text-[#172033] text-base">{liveMetrics.cpu}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, liveMetrics.cpu))}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC]">
            <div className="flex items-center justify-between text-[#667085] text-xs mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <HardDrive size={14} className="text-teal-600" /> MEMORY
              </span>
              <span className="font-bold text-[#172033] text-base">{liveMetrics.memory}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, liveMetrics.memory))}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC]">
            <div className="flex items-center justify-between text-[#667085] text-xs mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Users size={14} className="text-indigo-600" /> ACTIVE SESSIONS
              </span>
            </div>
            <span className="font-bold text-[#172033] text-xl block mt-1">
              {liveMetrics.sessions} <span className="text-xs font-normal text-[#667085]">concurrent</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC]">
            <div className="flex items-center justify-between text-[#667085] text-xs mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Radio size={14} className="text-emerald-600" /> HEARTBEAT
              </span>
            </div>
            <span className="font-bold text-emerald-700 text-xs block mt-1 font-mono">
              {new Date(liveMetrics.lastHeartbeat).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Real-time Telemetry History Chart */}
        <div className="p-5 rounded-xl bg-white border border-[#E4E7EC] space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-2">
                <Activity size={15} className="text-blue-600" /> Server Performance Telemetry History
              </h3>
              <p className="text-[11px] text-[#667085]">
                Recent historical CPU and Memory utilization streamed from backend
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> CPU %
              </span>
              <span className="flex items-center gap-1.5 text-teal-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Memory %
              </span>
            </div>
          </div>

          <div className="h-56">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#667085]">
                Awaiting telemetry stream from server...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="drillCpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="drillMemGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5A4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0EA5A4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" />
                  <XAxis dataKey="time" tick={{ fill: '#667085', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#667085', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E4E7EC',
                      borderRadius: '8px',
                      color: '#172033',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    name="CPU %"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#drillCpuGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    name="Memory %"
                    stroke="#0EA5A4"
                    strokeWidth={2}
                    fill="url(#drillMemGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Node Configuration Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-[#E4E7EC] font-mono text-xs">
          <div>
            <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">IP Address</span>
            <span className="text-[#172033] font-bold">{server.ipAddress}</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">Hostname</span>
            <span className="text-[#172033] font-bold">{server.hostname || 'target.threatx.local'}</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">Operating System</span>
            <span className="text-[#172033] font-sans">{server.os || 'Ubuntu 22.04 LTS'}</span>
          </div>
          <div>
            <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">Agent Version</span>
            <span className="text-[#172033] font-sans">{server.agentVersion || 'threatx-agent-1.0'}</span>
          </div>
        </div>

        {/* Agent Key Token Box */}
        {server.apiKey && (
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200">
            <span className="text-[10px] text-[#667085] uppercase font-bold tracking-wider flex items-center gap-1.5 mb-1.5">
              <Key size={12} className="text-blue-600" /> Monitored Agent Secret Key
            </span>
            <p className="font-mono text-xs text-blue-900 select-all break-all bg-white p-2.5 rounded-lg border border-blue-200">
              {server.apiKey}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E7EC] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-gray-900 font-semibold text-xs transition-all shadow-xs"
          >
            Close Drill-down Panel
          </button>
        </div>
      </div>
    </div>
  );
}

