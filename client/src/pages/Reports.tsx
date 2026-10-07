import { useEffect, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import RiskBadge from '../components/ui/RiskBadge';
import { api } from '../api/client';
import type { ThreatEvent, Incident } from '../types';

export default function Reports() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');

  useEffect(() => {
    api.getEvents({ limit: 500 }).then(setEvents);
    api.getIncidents().then(setIncidents);
  }, []);

  // Filter events by date range
  const getFilteredData = () => {
    if (dateRange === 'all') return { events, incidents };
    const cutoff = Date.now() - parseInt(dateRange) * 24 * 3600000;
    return {
      events: events.filter(e => new Date(e.timestamp).getTime() >= cutoff),
      incidents: incidents.filter(i => new Date(i.createdAt).getTime() >= cutoff),
    };
  };

  const { events: filteredEvents, incidents: filteredIncidents } = getFilteredData();

  const exportJSON = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: dateRange === 'all' ? 'All history' : `Last ${dateRange} days`,
      summary: {
        totalThreats: filteredEvents.length,
        highRisk: filteredEvents.filter((e) => e.riskLevel === 'High').length,
        mediumRisk: filteredEvents.filter((e) => e.riskLevel === 'Medium').length,
        lowRisk: filteredEvents.filter((e) => e.riskLevel === 'Low').length,
        openIncidents: filteredIncidents.filter((i) => i.status === 'open').length,
      },
      threats: filteredEvents,
      incidents: filteredIncidents,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threatx-security-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    // Generate CSV content
    const headers = ['Event ID', 'Type', 'Risk Level', 'Score', 'User', 'IP Address', 'Timestamp', 'Explanation'];
    const rows = filteredEvents.map(e => [
      e.id,
      e.threatType,
      e.riskLevel,
      e.riskScore.toString(),
      e.username,
      e.ipAddress,
      e.timestamp,
      `"${e.explanation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threatx-security-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Grade posture based on score
  const getPostureGrade = () => {
    const highCount = filteredEvents.filter(e => e.riskLevel === 'High').length;
    const score = Math.max(0, 100 - highCount * 12);
    if (score >= 85) return { grade: 'A - SECURE', color: 'text-emerald-400', desc: 'No critical threats detected recently.' };
    if (score >= 65) return { grade: 'C - WARNING', color: 'text-amber-400', desc: 'Active security investigations required.' };
    return { grade: 'F - CRITICAL', color: 'text-red-400', desc: 'Critical vulnerabilities detected.' };
  };

  const posture = getPostureGrade();

  return (
    <div className="space-y-6">
      <Header title="Reports & Exporters" subtitle="Generate regulatory compliance & security reports" />

      {/* Date Filter & Export buttons */}
      <GlassCard className="py-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500/50"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All History</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:text-white transition-all text-xs font-semibold text-slate-300 cursor-pointer"
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/15 cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </GlassCard>

      {/* Security Posture Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 border border-white/10 flex flex-col justify-between">
          <h3 className="text-[13px] font-semibold text-slate-200 uppercase tracking-wider mb-4">Security posture summary</h3>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/40 border border-white/5">
            <ShieldCheck size={36} className={`shrink-0 ${posture.color}`} />
            <div>
              <p className={`text-xl font-black ${posture.color}`}>{posture.grade}</p>
              <p className="text-xs text-slate-300 mt-1">{posture.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5 text-center">
            <div>
              <p className="text-2xl font-bold text-red-400 tabular-nums">{filteredEvents.filter(e => e.riskLevel === 'High').length}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Critical Threats</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400 tabular-nums">{filteredIncidents.filter(i => i.status !== 'closed').length}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Open Incidents</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{filteredEvents.length}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Total Events</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <h3 className="text-[13px] font-semibold text-slate-200 uppercase tracking-wider mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Incident MTTR</span>
              <span className="text-slate-200 font-bold tabular-nums">14 Minutes</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Sensor Uptime</span>
              <span className="text-emerald-400 font-bold tabular-nums">99.98%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">False Positive Ratio</span>
              <span className="text-slate-200 font-bold tabular-nums">2.4%</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Reports preview */}
      <GlassCard>
        <h3 className="text-[13px] font-semibold text-slate-200 uppercase tracking-wider mb-4">Report Preview (Recent logs)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 uppercase tracking-wider font-semibold text-[11px] pb-3">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Risk Level</th>
                <th className="pb-3 pr-4">Risk Score</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.slice(0, 10).map((e) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 font-semibold text-slate-200 capitalize">{e.threatType.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-300">{e.username}</td>
                  <td className="py-3 pr-4"><RiskBadge level={e.riskLevel} /></td>
                  <td className="py-3 pr-4 font-mono font-bold text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            e.riskLevel === 'High' ? 'bg-red-500' :
                            e.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${e.riskScore}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{e.riskScore}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-400 font-medium tabular-nums">{new Date(e.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
