import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, User, ChevronRight, CheckCircle2, UserCheck, Sparkles, Bot } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import RiskBadge from '../components/ui/RiskBadge';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import { api } from '../api/client';
import type { Incident } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors: Record<string, string> = {
  open: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]',
  investigating: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const ANALYSTS = ['Security Team', 'Admin User', 'Alice Johnson', 'Bob Smith'];

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents(filter || undefined);
      setIncidents(data);
      setError(null);
    } catch (err) {
      console.error('[Incidents] load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

  const openDetail = async (id: string) => {
    const detail = await api.getIncident(id);
    setSelected(detail);
    setAiReport(null);
  };

  const runAiInvestigation = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
      const res = await api.analyzeIncidentAssistant(selected.id);
      if (res.analysis) {
        setAiReport(res.analysis);
      }
    } catch (err) {
      console.error('[Incidents] AI assistant error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const addNote = async () => {
    if (!selected || !note.trim()) return;
    const updated = await api.addIncidentNote(selected.id, {
      action: 'Investigation note added',
      analyst: 'Admin User',
      notes: note,
      status: selected.status === 'open' ? 'investigating' : selected.status,
    });
    setSelected(updated);
    setNote('');
    fetchIncidents();
  };

  const updateStatus = async (status: Incident['status']) => {
    if (!selected) return;
    const updated = await api.addIncidentNote(selected.id, {
      action: `Status changed to ${status}`,
      analyst: 'Admin User',
      notes: `Analyst manually updated incident status state.`,
      status,
    });
    setSelected(updated);
    fetchIncidents();
  };

  const updateAssignment = async (assignedTo: string) => {
    if (!selected) return;
    const updated = await api.updateIncident(selected.id, { assignedTo });
    setSelected(updated);
    fetchIncidents();
  };

  // Stats calculation
  const totalOpen = incidents.filter(i => i.status === 'open').length;
  const totalInvestigating = incidents.filter(i => i.status === 'investigating').length;
  const totalResolved = incidents.filter(i => i.status === 'resolved').length;

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Loading incidents...
          </p>
        </div>
      </div>
    );
  }

  if (error && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2">Connection Lost</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchIncidents(); }}
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
      <Header title="Incidents & Investigations" subtitle="Track high-risk threat event resolution status" />

      {/* Mini summary stats strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="py-3 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Open Incidents</p>
            <p className="text-2xl font-bold text-red-400 mt-1 tabular-nums">{totalOpen}</p>
          </div>
          <AlertTriangle size={20} className="text-red-500/40" />
        </GlassCard>
        <GlassCard className="py-3 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Investigating</p>
            <p className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{totalInvestigating}</p>
          </div>
          <Clock size={20} className="text-amber-500/40" />
        </GlassCard>
        <GlassCard className="py-3 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolved Cases</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{totalResolved}</p>
          </div>
          <CheckCircle2 size={20} className="text-emerald-500/40" />
        </GlassCard>
      </div>

      <div className="flex gap-2">
        {['', 'open', 'investigating', 'resolved', 'closed'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === s
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 bg-white/5 border border-transparent'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {incidents.map((inc) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard
                  className={`cursor-pointer transition-all hover:border-blue-500/25 ${selected?.id === inc.id ? 'border-blue-500/35 shadow-lg' : ''}`}
                  onClick={() => openDetail(inc.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-red-400 shrink-0" />
                      <RiskBadge level={inc.riskLevel} />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border uppercase ${statusColors[inc.status]}`}>
                      {inc.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 truncate">{inc.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">{inc.description}</p>
                  <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-blue-500/5 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><User size={12} className="text-slate-400" /> {inc.assignedTo}</span>
                    <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {new Date(inc.createdAt).toLocaleDateString()}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
          {incidents.length === 0 && (
            <GlassCard className="text-center py-12 border border-blue-500/10">
              <p className="text-slate-300 text-sm font-semibold">No incidents found in this filter state</p>
            </GlassCard>
          )}
        </div>

        {/* Incident Detail Pane */}
        <div className="lg:col-span-3">
          {selected ? (
            <GlassCard className="border border-blue-500/15">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 pb-4 border-b border-blue-500/10">
                <div>
                  <h3 className="text-lg font-bold text-white">{selected.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <RiskBadge level={selected.riskLevel} />
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border uppercase ${statusColors[selected.status]}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>

                {/* Analyst assignment selection */}
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-slate-400" />
                  <select
                    value={selected.assignedTo}
                    onChange={(e) => updateAssignment(e.target.value)}
                    className="px-2.5 py-1 rounded bg-[#0a0e1a] border border-blue-500/15 text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    {ANALYSTS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-black/20 p-3 rounded-lg border border-blue-500/5">{selected.description}</p>

              {/* AI Copilot Investigation Section */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-cyan-950/20 via-blue-950/20 to-purple-950/20 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Sparkles size={13} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-cyan-200 tracking-wide">SOC AI Copilot (Gemini)</h4>
                      <p className="text-[10px] text-slate-400">Autonomous deep-threat analysis & playbooks</p>
                    </div>
                  </div>
                  <button
                    onClick={runAiInvestigation}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  >
                    {aiLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-cyan-400/40 border-t-cyan-300 rounded-full animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Bot size={13} />
                        <span>{aiReport ? 'Re-Analyze with AI' : 'AI Investigation Assistant'}</span>
                      </>
                    )}
                  </button>
                </div>

                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-3 border-t border-cyan-500/15"
                  >
                    <div className="bg-black/30 p-3 rounded-lg border border-cyan-500/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Incident Assessment Summary</span>
                        <div className="flex items-center gap-2">
                          {aiReport.cached && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-500/20">
                              CACHED
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                            Score: {aiReport.confidenceScore ?? 90}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{aiReport.summary}</p>
                    </div>

                    {aiReport.likelyCause && (
                      <div className="bg-black/20 p-2.5 rounded-lg border border-blue-500/10 text-xs">
                        <span className="text-[10px] font-extrabold uppercase text-blue-400 block mb-1">Likely Root Cause</span>
                        <p className="text-slate-400 leading-relaxed">{aiReport.likelyCause}</p>
                      </div>
                    )}

                    {aiReport.suggestedActions && aiReport.suggestedActions.length > 0 && (
                      <div className="bg-black/20 p-2.5 rounded-lg border border-emerald-500/10 text-xs">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-400 block mb-1.5">Suggested Containment Actions</span>
                        <ul className="space-y-1.5">
                          {aiReport.suggestedActions.map((action: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                              <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-snug">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="mb-6">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Update Incident Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(['open', 'investigating', 'resolved', 'closed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(st)}
                      disabled={selected.status === st}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                        selected.status === st
                          ? 'bg-blue-600/15 text-blue-400 border-blue-500/30 opacity-60'
                          : 'bg-white/5 text-slate-300 border-blue-500/10 hover:bg-white/10'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Related Threat Events */}
              {selected.threats && selected.threats.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Associated Threat Payload</h4>
                  {selected.threats.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-950/30 border border-blue-500/10 mb-2 text-xs flex gap-2.5 items-start">
                      <ThreatTypeIcon type={t.threatType} size={15} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between font-mono text-[10px] text-slate-500 mb-1">
                          <span>IP: {t.ipAddress}</span>
                          <span>Device: {t.device}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{t.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline Connector style */}
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">Analyst Case Timeline</h4>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 relative">
                {selected.investigationHistory.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500/60 border border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-500/30 to-transparent min-h-[30px]" />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-300">{entry.action}</span>
                        <ChevronRight size={10} className="text-slate-600" />
                        <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                          {entry.analyst}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-white/[0.01] p-2 rounded border border-white/5">
                          {entry.notes}
                        </p>
                      )}
                      <p className="text-[9px] text-slate-600 font-bold mt-1 uppercase">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note addition */}
              <div className="flex gap-2 pt-2 border-t border-blue-500/10">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter detailed investigation notes..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-blue-500/10 text-xs focus:outline-none focus:border-blue-500/30"
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold uppercase tracking-wider hover:bg-blue-500 transition-colors shrink-0"
                >
                  Commit Note
                </button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="flex items-center justify-center py-24 border border-blue-500/10">
              <p className="text-slate-500 text-sm font-semibold">Select an incident from the log to initialize investigation panel</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
