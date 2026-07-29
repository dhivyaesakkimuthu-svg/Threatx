import { useEffect, useState } from 'react';
import { Server as ServerIcon, Users, ShieldAlert, ShieldCheck } from 'lucide-react';
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
  const [animateKey, setAnimateKey] = useState(0);

  const loadData = () => {
    api.getDashboardStats().then((data) => {
      setStats(data);
      setAnimateKey(prev => prev + 1);
    }).catch(console.error);
    api.getEvents({ limit: 5 }).then(setRecentThreats).catch(console.error);
    api.getServers().then(setServers).catch(console.error);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const pieData = stats
    ? [
        { name: 'Low', value: stats.riskDistribution.low },
        { name: 'Medium', value: stats.riskDistribution.medium },
        { name: 'High', value: stats.riskDistribution.high },
      ]
    : [];

  return (
    <div key={animateKey} className="space-y-6">
      <Header title="Security Operations Center" subtitle="Real-time predictive threat analytics dashboard" />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Infrastructure" value={stats?.totalServers ?? '—'} icon={ServerIcon} accent="blue" trend="Active Nodes" />
        <StatCard title="Active User Sessions" value={stats?.activeUsers ?? '—'} icon={Users} accent="cyan" trend="Under Analysis" />
        <StatCard title="Active Incidents" value={stats?.liveThreats ?? '—'} icon={ShieldAlert} accent="red" trend="Requires Action" />
        <StatCard title="Risk Analysis Score" value={stats ? `${stats.securityScore}%` : '—'} icon={ShieldCheck} accent="green" trend="System Rating" />
      </div>

      {/* Server Health Status Strip */}
      <GlassCard className="py-4 border border-blue-500/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Infrastructure Health Feed</h4>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-slate-300">
                {servers.filter(s => s.status === 'online').length} / {servers.length} Connected
              </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Timeline Area Chart */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Threat Timeline (24h)</h3>
            <LiveBadge active={stats ? stats.liveThreats > 0 : false} label="Live Feed" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats?.threatTimeline ?? []}>
              <defs>
                <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0e1424', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, fontSize: 12 }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#ef4444" fill="url(#gradHigh)" name="High Risk" />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="url(#gradMed)" name="Medium Risk" />
              <Area type="monotone" dataKey="low" stackId="1" stroke="#22c55e" fill="url(#gradLow)" name="Low Risk" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Security Score Ring */}
        <GlassCard className="flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 self-start">Risk posture</h3>
          <SecurityScoreRing score={stats?.securityScore ?? 0} size={150} strokeWidth={12} />
          
          <div className="flex justify-center gap-4 mt-6 w-full pt-4 border-t border-blue-500/10">
            {['Low', 'Medium', 'High'].map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
                <span className="text-sm font-extrabold mt-1" style={{ color: RISK_COLORS[i] }}>
                  {pieData[i]?.value ?? 0}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* World map location of threats */}
        <GlassCard className="lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Threat Origins (Map)</h3>
          <div className="relative border border-blue-500/10 rounded-xl bg-slate-950/30 overflow-hidden flex items-center justify-center h-64 p-4">
            <svg viewBox="0 0 360 180" className="w-full h-full opacity-60">
              {/* Fake world map dots */}
              <circle cx="80" cy="55" r="2" fill="#475569" />
              <circle cx="140" cy="48" r="2" fill="#475569" />
              <circle cx="68" cy="52" r="2" fill="#475569" />
              <circle cx="195" cy="42" r="2" fill="#475569" />
              <circle cx="275" cy="60" r="2" fill="#475569" />
              <circle cx="285" cy="140" r="2" fill="#475569" />
              <path d="M 20 90 L 340 90" stroke="rgba(59,130,246,0.05)" strokeDasharray="3,3" />

              {/* Threat source pulses */}
              {mapCities.map((city) => (
                <g key={city.name}>
                  <circle cx={city.x} cy={city.y} r="10" className="fill-red-500/10 stroke-red-500/20 radar-ping-ring origin-center" />
                  <circle cx={city.x} cy={city.y} r="4" className="fill-red-500 threat-pulse-active" />
                </g>
              ))}
            </svg>
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-3">
              {mapCities.map((city) => (
                <div key={city.name} className="flex items-center gap-1.5 bg-[#0a0e1a]/80 px-2 py-1 rounded border border-blue-500/10 text-[9px] font-bold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {city.name} ({city.threats})
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Top Threat Actors / Recent Logins */}
        <GlassCard>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Recent Access Log</h3>
          <div className="space-y-3.5 max-h-64 overflow-y-auto">
            {(stats?.recentLogins ?? []).slice(0, 5).map((login) => (
              <div key={login.id} className="flex items-center justify-between py-2 border-b border-blue-500/5 last:border-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${login.success ? 'bg-emerald-400' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-slate-200">{login.username}</p>
                    <p className="text-[10px] text-slate-500 truncate">{login.device} · {login.location}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400 font-mono">{login.ipAddress}</p>
                  <p className="text-[9px] text-slate-600">{new Date(login.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentLogins || stats.recentLogins.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-4">No recent login activity</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Latest Threats Detail Stream */}
      <GlassCard className="border border-red-500/10 hover:border-red-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Active Threat Stream</h3>
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
                  <span className="text-xs font-bold text-slate-300">{t.username}</span>
                  <RiskBadge level={t.riskLevel} />
                </div>
                <div className="flex gap-2.5 items-start mt-2">
                  <ThreatTypeIcon type={t.threatType} size={16} />
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{t.explanation}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-blue-500/5 text-[9px] text-slate-500">
                <span className="font-mono">{t.ipAddress}</span>
                <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
              </div>
            </motion.div>
          ))}
          {recentThreats.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4 col-span-full">No active threats detected</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
