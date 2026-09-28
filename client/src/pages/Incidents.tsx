import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, User, ChevronRight, CheckCircle2, UserCheck } from 'lucide-react';
import Topbar from '../components/Topbar';
import RiskBadge from '../components/ui/RiskBadge';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import Button from '../components/ui/Button';
import { api } from '../api/client';
import type { Incident } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const statusBadgeClasses: Record<string, string> = {
  open: 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]',
  investigating: 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
  resolved: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  closed: 'bg-[#F8FAFC] text-[#667085] border-[#E4E7EC]',
};

const ANALYSTS = ['Security Team', 'Admin User', 'Alice Johnson', 'Bob Smith'];

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<string>('');

  const fetchIncidents = () => {
    api.getIncidents(filter || undefined).then(setIncidents).catch(console.error);
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
    <div className="space-y-6 animate-fade-in">
      <Topbar
        title="Incidents & Investigations"
        subtitle="Track high-risk threat event resolution status and security incident lifecycles"
      />

      {/* Mini summary stats strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm flex items-center justify-between border-l-4 border-l-[#DC2626]">
          <div>
            <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">Open Incidents</p>
            <p className="text-2xl font-bold text-[#DC2626] mt-1">{totalOpen}</p>
          </div>
          <div className="p-2 rounded-lg bg-[#FEF2F2] text-[#DC2626]">
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm flex items-center justify-between border-l-4 border-l-[#D97706]">
          <div>
            <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">Investigating</p>
            <p className="text-2xl font-bold text-[#D97706] mt-1">{totalInvestigating}</p>
          </div>
          <div className="p-2 rounded-lg bg-[#FFFBEB] text-[#D97706]">
            <Clock size={20} />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm flex items-center justify-between border-l-4 border-l-[#059669]">
          <div>
            <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">Resolved Cases</p>
            <p className="text-2xl font-bold text-[#059669] mt-1">{totalResolved}</p>
          </div>
          <div className="p-2 rounded-lg bg-[#ECFDF5] text-[#059669]">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['', 'open', 'investigating', 'resolved', 'closed'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === s
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#667085] hover:text-[#172033] bg-white border border-[#E4E7EC]'
            }`}
          >
            {s || 'All Incidents'}
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
                <div
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:border-[#2563EB]/40 shadow-sm ${
                    selected?.id === inc.id ? 'border-[#2563EB] ring-2 ring-[#2563EB]/10' : 'border-[#E4E7EC]'
                  }`}
                  onClick={() => openDetail(inc.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-[#DC2626] shrink-0" />
                      <RiskBadge level={inc.riskLevel} />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${statusBadgeClasses[inc.status] || ''}`}>
                      {inc.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#172033] truncate">{inc.title}</h3>
                  <p className="text-xs text-[#667085] line-clamp-2 mt-1 leading-relaxed">{inc.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F1F4F9] text-[11px] text-[#667085] font-medium">
                    <span className="flex items-center gap-1"><User size={12} className="text-[#98A2B3]" /> {inc.assignedTo}</span>
                    <span className="flex items-center gap-1 font-mono"><Clock size={12} className="text-[#98A2B3]" /> {new Date(inc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {incidents.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E4E7EC] text-center py-12 shadow-sm">
              <p className="text-[#667085] text-xs font-medium">No incidents found in this filter state</p>
            </div>
          )}
        </div>

        {/* Incident Detail Pane */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-xl border border-[#E4E7EC] p-5 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E4E7EC]">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">{selected.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <RiskBadge level={selected.riskLevel} />
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${statusBadgeClasses[selected.status] || ''}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>

                {/* Analyst assignment selection */}
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-[#667085]" />
                  <select
                    value={selected.assignedTo}
                    onChange={(e) => updateAssignment(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  >
                    {ANALYSTS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-[#475467] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E4E7EC]">
                {selected.description}
              </div>

              {/* Status Action Buttons */}
              <div>
                <h4 className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-2.5">Update Incident Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(['open', 'investigating', 'resolved', 'closed'] as const).map((st) => (
                    <Button
                      key={st}
                      variant={selected.status === st ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => updateStatus(st)}
                      disabled={selected.status === st}
                    >
                      {st.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Related Threat Events */}
              {selected.threats && selected.threats.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-2.5">Associated Threat Payload</h4>
                  {selected.threats.map((t) => (
                    <div key={t.id} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] mb-2 text-xs flex gap-2.5 items-start">
                      <ThreatTypeIcon type={t.threatType} size={15} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between font-mono text-[10px] text-[#667085] mb-1">
                          <span>IP: {t.ipAddress}</span>
                          <span>Device: {t.device}</span>
                        </div>
                        <p className="text-xs text-[#475467] leading-relaxed">{t.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline Connector style */}
              <div>
                <h4 className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-3">Analyst Case Timeline</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {selected.investigationHistory.map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                        <div className="w-0.5 flex-1 bg-[#E4E7EC] min-h-[24px]" />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-[#172033]">{entry.action}</span>
                          <ChevronRight size={10} className="text-[#98A2B3]" />
                          <span className="text-[10px] text-[#667085] font-medium bg-[#F1F4F9] px-2 py-0.5 rounded">
                            {entry.analyst}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-[#475467] mt-1 leading-relaxed bg-[#F8FAFC] p-2 rounded border border-[#E4E7EC]">
                            {entry.notes}
                          </p>
                        )}
                        <p className="text-[10px] text-[#98A2B3] font-mono mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note addition */}
              <div className="flex gap-2 pt-3 border-t border-[#E4E7EC]">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter detailed investigation notes..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addNote}
                >
                  Commit Note
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E4E7EC] flex items-center justify-center py-24 shadow-sm">
              <p className="text-[#667085] text-xs font-medium">Select an incident from the list to view the investigation panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
