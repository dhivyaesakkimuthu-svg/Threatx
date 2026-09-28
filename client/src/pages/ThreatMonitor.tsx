import { useEffect, useState } from 'react';
import { RefreshCw, MapPin, Monitor, User, Clock, ShieldAlert, ShieldX, Key, Search } from 'lucide-react';
import Topbar from '../components/Topbar';
import RiskBadge from '../components/ui/RiskBadge';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import LiveBadge from '../components/ui/LiveBadge';
import Button from '../components/ui/Button';
import { api } from '../api/client';
import type { ThreatEvent, RiskLevel } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const threatLabels: Record<string, string> = {
  unknown_ip: 'Unknown IP Location',
  unusual_login_time: 'Unusual Work Hours login',
  new_device: 'Unregistered Terminal Device',
  failed_login_attempts: 'Brute-force login Pattern',
  impossible_travel: 'Impossible Velocity Travel',
  unauthorized_file_access: 'Confidential Document Access',
  restricted_folder_access: 'Restricted Directory Navigation',
  mass_download: 'High-Volume Data Exfiltration',
};

export default function ThreatMonitor() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [filter, setFilter] = useState<RiskLevel | 'All'>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    const params = filter !== 'All' ? { riskLevel: filter, limit: 100 } : { limit: 100 };
    api
      .getEvents(params)
      .then((data) => {
        // Sort newest first
        const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEvents(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleAcknowledge = async (id: string) => {
    await api.acknowledgeEvent(id);
    setEvents((ev) => ev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e)));
  };

  const handleBlockUser = (username: string) => {
    alert(`Administrative Command Sent: Suspend user identity session for ${username}`);
  };

  const handleForceMFA = (username: string) => {
    alert(`Administrative Command Sent: Force prompt verification request next login for ${username}`);
  };

  // Filter based on search bar
  const filteredEvents = events.filter((e) => {
    const term = search.toLowerCase();
    return (
      e.username.toLowerCase().includes(term) ||
      e.ipAddress.toLowerCase().includes(term) ||
      (threatLabels[e.threatType] || e.threatType).toLowerCase().includes(term)
    );
  });

  const highRiskTickerEvents = events.filter((e) => e.riskLevel === 'High').slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <Topbar
        title="Real-time Threat Monitor"
        subtitle="Live security events stream processed by threat engine"
      />

      {/* Live high risk event ticker */}
      {highRiskTickerEvents.length > 0 && (
        <div className="w-full bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-hidden text-xs text-[#DC2626] font-semibold relative">
          <div className="shrink-0 flex items-center gap-1.5 uppercase text-[10px] tracking-wider bg-white px-2 py-0.5 rounded border border-[#FEE2E2] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
            Alert Ticker
          </div>
          <div className="flex-1 overflow-hidden relative h-4">
            <div className="absolute flex gap-12 whitespace-nowrap animate-[shimmer_15s_linear_infinite]">
              {highRiskTickerEvents.map((e) => (
                <span key={e.id} className="inline-flex items-center gap-2">
                  <span className="font-bold text-[#DC2626]">⚠️ {e.username}</span>
                  <span className="text-[#98A2B3]">·</span>
                  <span className="text-[#475467] font-normal">{e.explanation}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Username, IP, threat..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full md:w-auto">
            <div className="flex gap-1.5">
              {(['All', 'High', 'Medium', 'Low'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === level
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-[#667085] hover:text-[#172033] bg-white border border-[#E4E7EC]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-[#667085] uppercase flex items-center gap-1.5">
                <LiveBadge active={true} label="" />
                {filteredEvents.length} Active Stream
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={12} className={loading ? 'animate-spin text-[#2563EB]' : ''} />}
                onClick={fetchEvents}
                aria-label="Refresh events"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Threat Stream List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`bg-white rounded-xl border border-[#E4E7EC] shadow-sm p-4 cursor-pointer transition-all hover:border-[#2563EB]/40 ${
                  event.acknowledged ? 'opacity-60' : ''
                }`}
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <ThreatTypeIcon type={event.threatType} size={18} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-[#172033]">
                          {threatLabels[event.threatType] || event.threatType}
                        </span>
                        <RiskBadge level={event.riskLevel} />
                        <span className="text-[10px] text-[#667085] font-semibold bg-[#F1F4F9] px-2 py-0.5 rounded">
                          Score: {event.riskScore}/100
                        </span>
                      </div>

                      {/* Risk rating visual bar */}
                      <div className="w-48 h-1.5 bg-[#F1F4F9] rounded-full overflow-hidden my-2">
                        <div
                          className={`h-full rounded-full ${
                            event.riskLevel === 'High'
                              ? 'bg-[#DC2626]'
                              : event.riskLevel === 'Medium'
                              ? 'bg-[#D97706]'
                              : 'bg-[#059669]'
                          }`}
                          style={{ width: `${event.riskScore}%` }}
                        />
                      </div>

                      <p className="text-xs text-[#475467] mt-1.5 leading-relaxed">{event.explanation}</p>

                      <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-[#667085] font-medium">
                        <span className="flex items-center gap-1"><User size={12} className="text-[#98A2B3]" /> {event.username}</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-[#2563EB]">{event.ipAddress}</span>
                        <span className="flex items-center gap-1"><Monitor size={12} className="text-[#98A2B3]" /> {event.device}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-[#98A2B3]" /> {event.location}</span>}
                        <span className="flex items-center gap-1 font-mono"><Clock size={12} className="text-[#98A2B3]" /> {new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!event.acknowledged && event.riskLevel === 'High' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(event.id);
                        }}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {expanded === event.id && (
                  <div className="mt-4 pt-4 border-t border-[#E4E7EC] animate-fade-in space-y-4">
                    {event.filePath && (
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] font-mono text-xs text-[#475467] break-all">
                        Target File resource: {event.filePath}
                      </div>
                    )}

                    <div>
                      <h4 className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-2">Automated Threat Recommendations</h4>
                      <ul className="space-y-1.5">
                        {(event.recommendedActions || []).map((action, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-[#475467]">
                            <span className="text-[#2563EB] font-bold">»</span> {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<ShieldX size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBlockUser(event.username);
                        }}
                      >
                        Block User Session
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Key size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleForceMFA(event.username);
                        }}
                      >
                        Force MFA Check
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEvents.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-[#E4E7EC] text-center py-12 shadow-sm">
            <ShieldAlert size={40} className="mx-auto text-[#98A2B3] mb-3" />
            <p className="text-[#667085] text-xs font-semibold">No threat events matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
