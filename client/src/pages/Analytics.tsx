import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import { api } from '../api/client';
import type { DashboardStats, ThreatEvent } from '../types';

// Hardcoded calendar data mockup for security events heatmap
const calendarDays = Array.from({ length: 28 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (27 - i));
  // Random activity weight
  const val = Math.floor(Math.sin(i * 0.5) * 4 + 4) + (i % 7 === 0 ? 3 : 0);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    val: Math.max(0, val),
  };
});

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<ThreatEvent[]>([]);

  useEffect(() => {
    api.getDashboardStats().then(setStats);
    api.getEvents({ limit: 200 }).then(setEvents);
  }, []);

  const threatTypeCounts = events.reduce<Record<string, number>>((acc, e) => {
    const label = e.threatType.replace(/_/g, ' ');
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(threatTypeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const userRisk = events.reduce<Record<string, { high: number; medium: number; low: number }>>((acc, e) => {
    if (!acc[e.username]) acc[e.username] = { high: 0, medium: 0, low: 0 };
    const key = e.riskLevel.toLowerCase() as 'high' | 'medium' | 'low';
    acc[e.username][key]++;
    return acc;
  }, {});

  const userData = Object.entries(userRisk).map(([user, counts]) => ({
    user,
    ...counts,
    total: counts.high + counts.medium + counts.low,
  })).sort((a, b) => b.total - a.total).slice(0, 8);

  // Radar Data for Multi-dimensional analysis
  const radarData = [
    { subject: 'Brute Force', A: threatTypeCounts['failed login attempts'] || 0, fullMark: 15 },
    { subject: 'Access Anomaly', A: threatTypeCounts['restricted folder access'] || 0, fullMark: 15 },
    { subject: 'Confidentiality', A: threatTypeCounts['unauthorized file access'] || 0, fullMark: 15 },
    { subject: 'Travel Speed', A: threatTypeCounts['impossible travel'] || 0, fullMark: 15 },
    { subject: 'Exfiltration', A: threatTypeCounts['mass download'] || 0, fullMark: 15 },
    { subject: 'IP Reputation', A: threatTypeCounts['unknown ip'] || 0, fullMark: 15 },
  ];

  // Top IPs/Devices
  const ipCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.ipAddress] = (acc[e.ipAddress] || 0) + 1;
    return acc;
  }, {});
  const topIPs = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <Header title="Security Analytics" subtitle="Deep data analytics, calendar heatmaps & risk radars" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-4">Threat Vectors breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0e1424', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, fontSize: 12, color: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Risk Radar widget */}
        <GlassCard className="flex flex-col justify-between">
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-2">Multidimensional Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 15]} tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="Threat Level" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-4 font-mono">24-Hour Threat Frequency</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats?.threatTimeline ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0e1424', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, fontSize: 12, color: '#f1f5f9' }} />
              <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="Total" />
              <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} dot={false} name="High" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Heatmap-style calendar view */}
        <GlassCard>
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-4">Threat Heatmap (28 Days)</h3>
          <div className="grid grid-cols-7 gap-1.5 justify-center">
            {calendarDays.map((day, i) => {
              const bg =
                day.val === 0 ? 'bg-slate-900 border border-slate-800/80 text-slate-400' :
                day.val <= 3 ? 'bg-blue-950/70 text-blue-300 border border-blue-500/20' :
                day.val <= 6 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-red-500/25 text-red-300 border border-red-500/40';
              return (
                <div
                  key={i}
                  title={`${day.date}: ${day.val} events`}
                  className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold ${bg}`}
                >
                  <span>{day.date.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>Low risk</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800" />
              <span className="w-2.5 h-2.5 rounded bg-blue-950 border border-blue-500/30" />
              <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/40" />
              <span className="w-2.5 h-2.5 rounded bg-red-500/30 border border-red-500/50" />
            </div>
            <span>High risk</span>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-4">User Risk Profiles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-white/10 uppercase tracking-wider font-semibold text-[11px] pb-3">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">High</th>
                  <th className="pb-3 pr-4">Medium</th>
                  <th className="pb-3 pr-4">Low</th>
                  <th className="pb-3 pr-4">Severity Weight</th>
                  <th className="pb-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {userData.map((u) => {
                  const score = u.high * 10 + u.medium * 5 + u.low * 2;
                  const maxPossible = 100;
                  const percentage = Math.min(100, (score / maxPossible) * 100);
                  return (
                    <tr key={u.user} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 font-semibold text-slate-200">{u.user}</td>
                      <td className="py-3 pr-4 text-red-400 font-bold tabular-nums">{u.high}</td>
                      <td className="py-3 pr-4 text-amber-400 font-bold tabular-nums">{u.medium}</td>
                      <td className="py-3 pr-4 text-emerald-400 font-bold tabular-nums">{u.low}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 font-mono tabular-nums">{score}</span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-slate-100 tabular-nums">{u.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Top IPs used in threats */}
        <GlassCard>
          <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider mb-4">Top Offensive IP Addresses</h3>
          <div className="space-y-3">
            {topIPs.map(({ ip, count }) => (
              <div key={ip} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="font-mono text-xs text-cyan-300 font-semibold">{ip}</span>
                <span className="text-[11px] uppercase font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 tabular-nums">
                  {count} Attacks
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
