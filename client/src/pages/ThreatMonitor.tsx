import { useEffect, useState } from 'react';
import { RefreshCw, MapPin, Monitor, User, Clock, ShieldAlert, ShieldX, Key, Search } from 'lucide-react';
import Topbar from '../components/Topbar';
import RiskBadge from '../components/ui/RiskBadge';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import LiveBadge from '../components/ui/LiveBadge';
import Button from '../components/ui/Button';
import { api } from '../services/api';
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
      .then((data: ThreatEvent[]) => {
        const sorted = [...data].sort((a, b) => new Date(b.timestamp || b.detectedAt || 0).getTime() - new Date(a.timestamp || a.detectedAt || 0).getTime());
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
    setEvents((ev) => ev.map((e) => (e.id === id || e.threatId === id ? { ...e, acknowledged: true } : e)));
  };

  const handleBlockUser = (username: string) => {
    alert(`Administrative Command Sent: Suspend user identity session for ${username}`);
  };

  const handleForceMFA = (username: string) => {
    alert(`Administrative Command Sent: Force prompt verification request next login for ${username}`);
  };

  const filteredEvents = events.filter((e) => {
    const term = search.toLowerCase();
    const u = (e.username || '').toLowerCase();
    const ip = (e.ipAddress || e.source || '').toLowerCase();
    const type = (threatLabels[e.threatType || e.type || ''] || e.threatType || e.type || '').toLowerCase();
    return u.includes(term) || ip.includes(term) || type.includes(term);
  });

  const highRiskTickerEvents = events.filter((e) => (e.riskLevel === 'High' || e.severity === 'critical' || e.severity === 'high')).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Real-time Threat Monitor"
        subtitle="Live security events stream processed by ThreatX detection engine"
      />

      {/* Live high risk event ticker */}
      {highRiskTickerEvents.length > 0 && (
        <div className="w-full bg-rose-950/40 border border-rose-500/40 rounded-2xl px-4 py-3 flex items-center gap-3 overflow-hidden text-xs text-rose-500 font-bold relative shadow-xl">
          <div className="shrink-0 flex items-center gap-1.5 uppercase text-[10px] tracking-wider bg-rose-50 px-2.5 py-1 rounded-full border border-rose-500/40 text-rose-500">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm" />
            Alert Ticker
          </div>
          <div className="flex-1 overflow-hidden relative h-5">
            <div className="absolute flex gap-12 whitespace-nowrap animate-[shimmer_15s_linear_infinite]">
              {highRiskTickerEvents.map((e) => (
                <span key={e.id || e.threatId} className="inline-flex items-center gap-2">
                  <span className="font-extrabold text-rose-600 font-mono">⚠️ {e.username || 'System'}:</span>
                  <span className="text-gray-600 font-medium">{e.explanation || e.description}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200  shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Username, IP, threat..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/70 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 transition-all font-sans"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full md:w-auto">
            <div className="flex gap-1.5 bg-gray-50/70 p-1 rounded-xl border border-gray-200">
              {(['All', 'High', 'Medium', 'Low'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === level
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 shadow-md'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-gray-600 uppercase flex items-center gap-1.5">
                <LiveBadge active={true} label="" />
                {filteredEvents.length} Active Stream
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />}
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
          {filteredEvents.map((event) => {
            const eId = event.id || event.threatId;
            const isCritOrHigh = (event.riskLevel === 'High' || event.severity === 'critical' || event.severity === 'high');
            return (
              <motion.div
                key={eId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <div
                  className={`bg-white rounded-2xl border  shadow-xl p-5 cursor-pointer transition-all hover:border-cyan-500/50 ${
                    event.acknowledged ? 'opacity-60 border-gray-200' : isCritOrHigh ? 'border-rose-500/40 shadow-sm' : 'border-gray-200'
                  }`}
                  onClick={() => setExpanded(expanded === eId ? null : eId)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <ThreatTypeIcon type={event.threatType || event.type} size={20} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                          <span className="font-bold text-sm text-gray-900">
                            {threatLabels[event.threatType || event.type] || event.threatType || event.type}
                          </span>
                          <RiskBadge level={event.riskLevel || (event.severity === 'critical' || event.severity === 'high' ? 'High' : 'Medium')} />
                          <span className="text-xs text-blue-500 font-mono font-bold bg-cyan-500/15 border border-blue-200 px-2.5 py-0.5 rounded-full">
                            Score: {event.riskScore}/100
                          </span>
                        </div>

                        {/* Risk rating visual bar */}
                        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden my-2.5">
                          <div
                            className={`h-full rounded-full ${
                              isCritOrHigh
                                ? 'bg-gradient-to-r from-orange-500 to-rose-500 shadow-sm'
                                : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                            }`}
                            style={{ width: `${event.riskScore}%` }}
                          />
                        </div>

                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{event.explanation || event.description}</p>

                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 font-mono">
                          <span className="flex items-center gap-1"><User size={13} className="text-blue-600" /> {event.username || 'unknown'}</span>
                          <span className="flex items-center gap-1 font-bold text-blue-500">{event.ipAddress || event.source}</span>
                          <span className="flex items-center gap-1"><Monitor size={13} className="text-gray-500" /> {event.device || event.target || 'SRV-001'}</span>
                          {event.location && <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-500" /> {event.location}</span>}
                          <span className="flex items-center gap-1 text-gray-500"><Clock size={13} className="text-blue-600" /> {new Date(event.timestamp || event.detectedAt || 0).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions column */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {!event.acknowledged && isCritOrHigh && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(eId);
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details Panel */}
                  {expanded === eId && (
                    <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in space-y-4">
                      {event.filePath && (
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs text-blue-500 break-all">
                          Target File resource: {event.filePath}
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Automated Threat Recommendations</h4>
                        <ul className="space-y-1.5">
                          {(event.recommendedActions || []).map((action, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                              <span className="text-blue-600 font-bold">»</span> {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-2.5 pt-2">
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
            );
          })}
        </AnimatePresence>

        {filteredEvents.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 shadow-xl">
            <ShieldAlert size={44} className="mx-auto text-slate-600 mb-3" />
            <p className="text-gray-500 text-xs font-bold">No threat events matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
