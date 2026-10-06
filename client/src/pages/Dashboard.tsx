import { useEffect, useState } from 'react';
import { Server as ServerIcon, Users, ShieldAlert, ShieldCheck, Cpu, HardDrive, Activity, Radio } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import GlassCard from '../components/ui/GlassCard';
import RiskBadge from '../components/ui/RiskBadge';
import SecurityScoreRing from '../components/ui/SecurityScoreRing';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import LiveBadge from '../components/ui/LiveBadge';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import type { DashboardStats, ThreatEvent, Server } from '../types';
import { motion } from 'framer-motion';

const RISK_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

// Simple SVG World Map Cities Data
const mapCities = [
  { name: 'London', x: 140, y: 48, threats: 4 },
  { name: 'New York', x: 80, y: 55, threats: 12 },
  { name: 'Chicago', x: 68, y: 52, threats: 6 },
  { name: 'Moscow', x: 195, y: 42, threats: 18 },
  { name: 'Tokyo', x: 275, y: 60, threats: 2 },
  { name: 'Sydney', x: 285, y: 140, threats: 1 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatEvent[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [telemetry, setTelemetry] = useState<any | null>(null);
  const [nodeOnline, setNodeOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [s, e, srv] = await Promise.all([
        api.getDashboardStats(),
        api.getEvents({ limit: 5 }),
        api.getServers(),
      ]);
      setStats(s);
      setRecentThreats(e);
      setServers(srv);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [s, e, srv] = await Promise.all([
          api.getDashboardStats(),
          api.getEvents({ limit: 5 }),
          api.getServers(),
        ]);
        if (!cancelled) {
          setStats(s);
          setRecentThreats(e);
          setServers(srv);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[Dashboard] refresh failed:', err);
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    const fetchTelemetry = async () => {
      try {
        const res = await fetch('http://localhost:5001/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setTelemetry(data);
            setNodeOnline(true);
          }
        } else {
          if (!cancelled) setNodeOnline(false);
        }
      } catch {
        if (!cancelled) setNodeOnline(false);
      }
    };

    fetchTelemetry();
    const teleInterval = setInterval(fetchTelemetry, 5000);

    // Socket.IO real-time listeners
    const socket = getSocket();

    const handleThreatNew = (newThreat: ThreatEvent) => {
      if (cancelled) return;
      setRecentThreats((prev) => [newThreat, ...prev.filter((t) => t.id !== newThreat.id)].slice(0, 5));
      api.getDashboardStats().then((s) => !cancelled && setStats(s)).catch(console.error);
    };

    const handleAlertNew = () => {
      if (cancelled) return;
      api.getDashboardStats().then((s) => !cancelled && setStats(s)).catch(console.error);
    };

    const handleIncidentNew = () => {
      if (cancelled) return;
      api.getDashboardStats().then((s) => !cancelled && setStats(s)).catch(console.error);
    };

    socket.on('threat:new', handleThreatNew);
    socket.on('alert:new', handleAlertNew);
    socket.on('incident:new', handleIncidentNew);

    // Fallback 30s background poll
    const fallbackInterval = setInterval(fetchAll, 30000);

    return () => {
      cancelled = true;
      clearInterval(fallbackInterval);
      clearInterval(teleInterval);
      socket.off('threat:new', handleThreatNew);
      socket.off('alert:new', handleAlertNew);
      socket.off('incident:new', handleIncidentNew);
    };
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Loading telemetry...
          </p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2">Connection Lost</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); load(); }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pieData = stats
    ? [
        { name: 'Low', value: stats.riskDistribution.low },
        { name: 'Medium', value: stats.riskDistribution.medium },
        { name: 'High', value: stats.riskDistribution.high },
      ]
    : [];

  const timelineData = stats?.threatTimeline ?? [];
  const totalTimelineThreats = timelineData.reduce(
    (acc, item) => acc + (item.count || (item.high + item.medium + item.low) || 0),
    0
  );

  const cleanLogins = (stats?.recentLogins ?? [])
    .filter((login) => {
      const u = (login.username || '').toLowerCase().trim();
      const d = (login.device || '').toLowerCase().trim();
      const isUserUnknown = !u || u === 'unknown' || u === 'null';
      const isDeviceUnknown = !d || d === 'unknown' || d === 'unknown device' || d === 'null';
      if (isUserUnknown && isDeviceUnknown) return false;
      return true;
    })
    .filter((login, index, arr) => {
      const firstIndex = arr.findIndex((other) => {
        const sameTuple =
          other.username === login.username &&
          other.ipAddress === login.ipAddress &&
          other.device === login.device;
        const timeDiff = Math.abs(new Date(other.timestamp).getTime() - new Date(login.timestamp).getTime());
        return sameTuple && timeDiff < 30000;
      });
      return firstIndex === index;
    });

  return (
    <div className="space-y-6">
      <Header title="Security Operations Center" subtitle="Real-time predictive threat analytics dashboard" />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Infrastructure"
          value={stats ? (Number.isFinite(stats.totalServers) ? stats.totalServers : 0) : '—'}
          icon={ServerIcon}
          accent="blue"
          trend="Active Nodes"
        />
        <StatCard
          title="Active User Sessions"
          value={stats ? (Number.isFinite(stats.activeUsers) ? stats.activeUsers : 0) : '—'}
          icon={Users}
          accent="cyan"
          trend="Under Analysis"
        />
        <StatCard
          title="Live Threats"
          value={stats ? (Number.isFinite(stats.liveThreats) ? stats.liveThreats : 0) : '—'}
          icon={ShieldAlert}
          accent="red"
          trend="Awaiting Triage"
        />
        <StatCard
          title="Risk Analysis Score"
          value={stats ? `${(Number.isFinite(stats.securityScore) ? stats.securityScore : 0).toFixed(1)}%` : '—'}
          icon={ShieldCheck}
          accent="green"
          trend="System Rating"
        />
      </div>

      {/* Server Health Status Strip */}
      <GlassCard className="py-4 border border-blue-500/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-1">Infrastructure Health Feed</h4>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-300 tabular-nums">
                {servers.filter((s) => s.status === 'online').length} / {servers.length}
              </span>
              <span className="text-xs text-slate-400">Nodes Connected</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-1 md:justify-end">
            {servers.map((srv) => (
              <div
                key={srv.id}
                title={`${srv.name} (${srv.status})`}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                  srv.status === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${srv.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="truncate max-w-[120px]">{srv.name}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Live Demo Server Hardware & Session Telemetry */}
      <GlassCard className="border border-cyan-500/15 bg-gradient-to-r from-slate-950/40 via-cyan-950/10 to-slate-950/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 mb-3 border-b border-cyan-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radio size={15} className={nodeOnline ? 'animate-pulse text-cyan-400' : 'text-slate-500'} />
            </div>
            <div>
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-200">
                Monitored Node Telemetry (Flask Agent)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {telemetry?.hostname ?? 'theadx-node-01'} · Port 5001
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border flex items-center gap-1.5 ${
                nodeOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${nodeOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {nodeOnline ? 'Telemetry Streaming' : 'Awaiting Telemetry Source (:5001)'}
            </span>
          </div>
        </div>

        {nodeOnline && telemetry ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/10">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 font-medium"><Cpu size={13} className="text-cyan-400" /> CPU Load</span>
                <span className="font-mono text-cyan-300 font-bold tabular-nums">{Number(telemetry.cpuPercent ?? 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    (telemetry.cpuPercent ?? 0) > 75 ? 'bg-red-500' : (telemetry.cpuPercent ?? 0) > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, telemetry.cpuPercent ?? 0))}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/10">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 font-medium"><Activity size={13} className="text-purple-400" /> Memory (RAM)</span>
                <span className="font-mono text-purple-300 font-bold tabular-nums">{Number(telemetry.memoryPercent ?? 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, telemetry.memoryPercent ?? 0))}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/10">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span className="flex items-center gap-1 font-medium"><HardDrive size={13} className="text-blue-400" /> Disk Usage</span>
                <span className="font-mono text-blue-300 font-bold tabular-nums">{Number(telemetry.diskPercent ?? 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, telemetry.diskPercent ?? 0))}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/20 border border-cyan-500/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-medium"><Users size={13} className="text-emerald-400" /> Active Sessions</span>
                <span className="font-mono text-emerald-300 font-bold tabular-nums">{telemetry.activeSessionCount ?? 0}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono truncate">
                Processes: {telemetry.activeProcessCount ?? '—'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-cyan-500/10 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <Radio size={16} className="text-slate-400 shrink-0" />
              <span>Telemetry source offline (Agent on port 5001 not detected) — Awaiting live telemetry stream...</span>
            </div>
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
              HTTP :5001/telemetry
            </span>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Timeline Area Chart */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Threat Timeline (24h)</h3>
              <p className="text-xs text-slate-400">Hourly anomaly density across 24 hours</p>
            </div>
            <LiveBadge active={stats ? stats.liveThreats > 0 : false} label="Live Feed" />
          </div>

          <div className="relative h-[230px] w-full">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                <XAxis dataKey="time" minTickGap={24} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0e1424', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, fontSize: 12 }}
                />
                <Legend verticalAlign="top" height={32} iconType="circle" />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#ef4444" fill="url(#gradHigh)" name="High Risk" />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="url(#gradMed)" name="Medium Risk" />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#22c55e" fill="url(#gradLow)" name="Low Risk" />
              </AreaChart>
            </ResponsiveContainer>

            {totalTimelineThreats === 0 && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a]/60 backdrop-blur-[1px] pointer-events-none rounded-xl">
                <ShieldCheck size={28} className="text-emerald-400/80 mb-1.5" />
                <p className="text-xs font-semibold text-slate-200">No threat activity in the last 24 hours</p>
                <p className="text-xs text-slate-400">All connected infrastructure nodes reporting baseline security</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Security Score Ring */}
        <GlassCard className="flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-4 self-start">Risk posture</h3>
          <SecurityScoreRing score={stats?.securityScore ?? 100} size={150} strokeWidth={12} />

          <div className="flex justify-center gap-4 mt-6 w-full pt-4 border-t border-blue-500/10">
            {['Low', 'Medium', 'High'].map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                <span className="text-sm font-bold mt-1 tabular-nums" style={{ color: RISK_COLORS[i] }}>
                  {pieData[i]?.value ?? 0}
                </span>
              </div>
            ))}
          </div>
          {pieData.reduce((sum, d) => sum + (d.value || 0), 0) === 0 && (
            <p className="text-xs text-slate-400 mt-2">No threats recorded</p>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* World map location of threats */}
        <GlassCard className="lg:col-span-2">
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-3">Threat Origins (Map)</h3>
          <div className="relative border border-blue-500/10 rounded-xl bg-slate-950/40 overflow-hidden flex items-center justify-center h-56 p-4">
            <svg viewBox="0 0 360 180" className="w-full h-full opacity-80">
              {/* Subtle world map grid and latitude lines */}
              <line x1="20" y1="45" x2="340" y2="45" stroke="rgba(59,130,246,0.06)" strokeDasharray="2,4" />
              <line x1="20" y1="90" x2="340" y2="90" stroke="rgba(59,130,246,0.08)" strokeDasharray="3,3" />
              <line x1="20" y1="135" x2="340" y2="135" stroke="rgba(59,130,246,0.06)" strokeDasharray="2,4" />
              <line x1="90" y1="20" x2="90" y2="160" stroke="rgba(59,130,246,0.06)" strokeDasharray="2,4" />
              <line x1="180" y1="20" x2="180" y2="160" stroke="rgba(59,130,246,0.08)" strokeDasharray="3,3" />
              <line x1="270" y1="20" x2="270" y2="160" stroke="rgba(59,130,246,0.06)" strokeDasharray="2,4" />

              {/* World outline landmass points */}
              {/* North America */}
              <circle cx="60" cy="40" r="1.5" fill="#334155" />
              <circle cx="75" cy="45" r="1.5" fill="#334155" />
              <circle cx="95" cy="50" r="1.5" fill="#334155" />
              <circle cx="85" cy="65" r="1.5" fill="#334155" />
              <circle cx="65" cy="60" r="1.5" fill="#334155" />
              {/* South America */}
              <circle cx="100" cy="100" r="1.5" fill="#334155" />
              <circle cx="115" cy="120" r="1.5" fill="#334155" />
              <circle cx="105" cy="140" r="1.5" fill="#334155" />
              {/* Europe & Africa */}
              <circle cx="150" cy="40" r="1.5" fill="#334155" />
              <circle cx="165" cy="45" r="1.5" fill="#334155" />
              <circle cx="155" cy="70" r="1.5" fill="#334155" />
              <circle cx="165" cy="95" r="1.5" fill="#334155" />
              <circle cx="175" cy="130" r="1.5" fill="#334155" />
              {/* Asia & Australia */}
              <circle cx="215" cy="50" r="1.5" fill="#334155" />
              <circle cx="240" cy="55" r="1.5" fill="#334155" />
              <circle cx="260" cy="70" r="1.5" fill="#334155" />
              <circle cx="250" cy="90" r="1.5" fill="#334155" />
              <circle cx="295" cy="135" r="1.5" fill="#334155" />

              {/* Threat source pulses */}
              {mapCities.map((city) => (
                <g key={city.name}>
                  <circle cx={city.x} cy={city.y} r="12" className="fill-red-500/10 stroke-red-500/30 radar-ping-ring origin-center" />
                  <circle cx={city.x} cy={city.y} r="3.5" className="fill-red-500 threat-pulse-active" />
                  <text x={city.x + 6} y={city.y + 3} fill="#cbd5e1" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                    {city.name}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-2">
              {mapCities.slice(0, 4).map((city) => (
                <div key={city.name} className="flex items-center gap-1.5 bg-[#0a0e1a]/90 px-2 py-1 rounded border border-blue-500/15 text-[10px] font-bold text-slate-200 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {city.name} <span className="text-slate-400 font-mono">({city.threats})</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Top Threat Actors / Recent Logins */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Recent Access Log</h3>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Auth Audit</span>
          </div>
          <div className="space-y-3 max-h-56 overflow-y-auto">
            {cleanLogins.slice(0, 5).map((login) => {
              const username = (!login.username || login.username.toLowerCase() === 'unknown') ? 'System Event' : login.username;
              const ipAddress = (!login.ipAddress || login.ipAddress === '0.0.0.0') ? '—' : login.ipAddress;
              const device = (!login.device || login.device.toLowerCase().includes('unknown')) ? '' : login.device;
              const location = (!login.location || login.location.toLowerCase().includes('unknown')) ? '' : login.location;
              const subtitle = [device, location].filter(Boolean).join(' · ') || '—';

              return (
                <div
                  key={login.id}
                  className="flex items-center justify-between py-2 border-b border-blue-500/5 last:border-0 hover:bg-white/[0.02] px-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      title={login.success ? 'Authentication Succeeded' : 'Authentication Failed / Blocked'}
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        login.success
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                          : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-slate-100">{username}</p>
                      <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-300 font-mono tabular-nums">{ipAddress}</p>
                    <p className="text-[10px] text-slate-400">{new Date(login.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
            {cleanLogins.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShieldCheck size={28} className="text-slate-500 mb-2" />
                <p className="text-xs font-semibold text-slate-300">No access events recorded yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Live authentication activity will stream here in real-time</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Latest Threats Detail Stream */}
      <GlassCard className="border border-red-500/10 hover:border-red-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Active Threat Stream</h3>
          <LiveBadge active={true} label="Live Feed" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recentThreats.map((t) => (
            <motion.div
              key={t.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-3.5 rounded-xl bg-slate-950/20 border border-blue-500/10 hover:border-blue-500/25 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{t.username}</span>
                  <RiskBadge level={t.riskLevel} />
                </div>
                <div className="flex gap-2.5 items-start mt-2">
                  <ThreatTypeIcon type={t.threatType} size={16} />
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{t.explanation}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-blue-500/5 text-[11px] text-slate-400">
                <span className="font-mono tabular-nums">{t.ipAddress}</span>
                <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
              </div>
            </motion.div>
          ))}
          {recentThreats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center col-span-full">
              <ShieldCheck size={28} className="text-emerald-400/80 mb-1.5" />
              <p className="text-xs font-semibold text-slate-200">No active threats detected</p>
              <p className="text-xs text-slate-400">All incoming activity conforms to baseline behavioral profiles</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
