import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, User, ChevronRight, CheckCircle2 } from 'lucide-react';
import Topbar from '../components/Topbar';
import RiskBadge from '../components/ui/RiskBadge';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import Button from '../components/ui/Button';
import { api } from '../services/api';
import type { Incident, InvestigationEntry } from '../types';

const statusBadgeClasses: Record<string, string> = {
  open: 'bg-rose-50 text-rose-500 border-rose-500/40',
  investigating: 'bg-amber-500/20 text-amber-500 border-amber-500/40',
  resolved: 'bg-emerald-50 text-emerald-500 border-emerald-500/40',
  closed: 'bg-gray-100 text-gray-500 border-gray-300',
};

const ANALYSTS = ['Security Team', 'Admin User', 'Alice Johnson', 'Bob Smith'];

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<string>('');

  const fetchIncidents = () => {
    api.getIncidents(filter || undefined).then((data: Incident[]) => setIncidents(data)).catch(console.error);
  };

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

  const openDetail = async (id: string) => {
    const detail = await api.getIncident(id);
    setSelected(detail);
  };

  const addNote = async () => {
    if (!selected || !note.trim()) return;
    const updated = await api.addIncidentNote(selected.id, {
      action: 'Investigation note added',
      analyst: 'Admin User',
      notes: note,
      status: selected.status === 'open' ? 'investigating' : selected.status,
    });
    setSelected(updated as Incident);
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
    setSelected(updated as Incident);
    fetchIncidents();
  };

  const updateAssignment = async (assignedTo: string) => {
    if (!selected) return;
    const updated = await api.updateIncident(selected.id, { assignedTo });
    setSelected({ ...selected, ...updated });
    fetchIncidents();
  };

  // Stats calculation
  const totalOpen = incidents.filter((i) => i.status === 'open').length;
  const totalInvestigating = incidents.filter((i) => i.status === 'investigating').length;
  const totalResolved = incidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Incidents & Investigations"
        subtitle="Track high-risk threat event resolution status and security incident lifecycles"
      />

      {/* Mini summary stats strip - Dark Theme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Incidents</p>
            <p className="text-3xl font-black text-rose-600 font-mono mt-2">{totalOpen}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-500/40 text-rose-600">
            <AlertTriangle size={22} />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Investigating</p>
            <p className="text-3xl font-black text-amber-600 font-mono mt-2">{totalInvestigating}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-600">
            <Clock size={22} />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolved Cases</p>
            <p className="text-3xl font-black text-emerald-600 font-mono mt-2">{totalResolved}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-500/40 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Incident List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200  shadow-xl">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900">Active Case Queue</h3>
            <div className="flex gap-1.5 bg-gray-50/70 p-1 rounded-xl border border-gray-200">
              {['', 'open', 'investigating', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    filter === st
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {st || 'All Cases'}
                </button>
              ))}
            </div>
          </div>

          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => openDetail(inc.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 bg-white  shadow-xl hover:border-cyan-500/50 ${
                selected?.id === inc.id ? 'border-cyan-500 bg-slate-850 shadow-sm' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <ThreatTypeIcon type="Security Anomaly" size={20} />
                <div>
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">{inc.title}</span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusBadgeClasses[inc.status] || ''}`}>
                      {inc.status}
                    </span>
                    <RiskBadge level={inc.riskLevel} />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{inc.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-mono">
                    <span className="flex items-center gap-1.5"><User size={13} className="text-blue-600" /> {inc.assignedTo}</span>
                    <span className="flex items-center gap-1.5"><Clock size={13} className="text-blue-600" /> {new Date(inc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 shrink-0" />
            </div>
          ))}

          {incidents.length === 0 && (
            <div className="p-16 rounded-2xl bg-white border border-gray-200 text-center text-gray-500 text-xs font-bold">
              No active security incidents in queue.
            </div>
          )}
        </div>

        {/* Selected Incident Drawer */}
        <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
          {selected ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase font-bold font-mono tracking-wider block mb-1">
                  Incident Case #{selected.id.slice(-6)}
                </span>
                <h3 className="font-bold text-base text-gray-900">{selected.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusBadgeClasses[selected.status] || ''}`}>
                    {selected.status}
                  </span>
                  <RiskBadge level={selected.riskLevel} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Assign Lead Analyst</label>
                <select
                  value={selected.assignedTo}
                  onChange={(e) => updateAssignment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {ANALYSTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Lifecycle Status</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['open', 'investigating', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                        selected.status === st
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 border-cyan-400 shadow-md'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Timeline Notes &amp; Findings</label>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1">
                  {(selected.investigationHistory || []).map((tl: InvestigationEntry, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
                        <span className="font-bold text-blue-600">{tl.analyst}</span>
                        <span>{new Date(tl.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-700">{tl.notes || tl.action}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Log analyst observation..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500"
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  />
                  <Button variant="primary" size="sm" onClick={addNote}>
                    Log
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs font-bold">
              Select an incident from the queue to inspect lifecycle telemetry and log investigation notes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
