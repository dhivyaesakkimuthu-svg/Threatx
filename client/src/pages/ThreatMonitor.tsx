import { useEffect, useState } from 'react';
import { RefreshCw, MapPin, Monitor, User, Clock, ShieldAlert } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import RiskBadge from '../components/ui/RiskBadge';
import { api } from '../api/client';
import type { ThreatEvent, RiskLevel } from '../types';

const threatLabels: Record<string, string> = {
  unknown_ip: 'Unknown IP',
  unusual_login_time: 'Unusual Login Time',
  new_device: 'New Device',
  failed_login_attempts: 'Failed Logins',
  impossible_travel: 'Impossible Travel',
  unauthorized_file_access: 'Unauthorized Access',
  restricted_folder_access: 'Restricted Folder',
  mass_download: 'Mass Download',
};

import { useEffect, useState } from 'react';
import { RefreshCw, MapPin, Monitor, User, Clock, ShieldAlert, ShieldX, Key, Search } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import RiskBadge from '../components/ui/RiskBadge';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import LiveBadge from '../components/ui/LiveBadge';
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
    api.getEvents(params)
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
    console.log(`Action requested: Block User ${username}`);
    alert(`Administrative Command Sent: Suspend user identity session for ${username}`);
  };

  const handleForceMFA = (username: string) => {
    console.log(`Action requested: Force MFA for ${username}`);
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
    <div className="space-y-6">
      <Header title="Real-time Threat Monitor" subtitle="Live security events stream processed by threat engine" />

      {/* Live high risk event ticker */}
      {highRiskTickerEvents.length > 0 && (
        <div className="w-full bg-red-950/20 border border-red-500/25 rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-hidden text-xs text-red-400 font-bold relative">
          <div className="shrink-0 flex items-center gap-1.5 uppercase text-[10px] tracking-wider bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            Alert Ticker
          </div>
          <div className="flex-1 overflow-hidden relative h-4">
            <div className="absolute flex gap-12 whitespace-nowrap animate-[shimmer_15s_linear_infinite]">
              {highRiskTickerEvents.map((e) => (
                <span key={e.id} className="inline-flex items-center gap-2">
                  <span>⚠️ {e.username}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-normal">{e.explanation}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <GlassCard className="py-4 border border-blue-500/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Username, IP, threat..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-blue-500/10 text-xs focus:outline-none focus:border-blue-500/30"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full md:w-auto">
            <div className="flex gap-1.5">
              {(['All', 'High', 'Medium', 'Low'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === level
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-500 hover:text-slate-300 bg-white/5 border border-transparent'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <LiveBadge active={true} label="" />
                {filteredEvents.length} Active Stream
              </span>
              <button
                onClick={fetchEvents}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-white/5 transition-all"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

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
              <GlassCard
                className={`cursor-pointer transition-all hover:border-blue-500/20 ${event.acknowledged ? 'opacity-50' : ''}`}
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <ThreatTypeIcon type={event.threatType} size={18} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-extrabold text-sm text-slate-200">
                          {threatLabels[event.threatType] || event.threatType}
                        </span>
                        <RiskBadge level={event.riskLevel} />
                        <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                          Score: {event.riskScore}/100
                        </span>
                      </div>
                      
                      {/* Risk rating visual bar */}
                      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden my-2">
                        <div
                          className={`h-full rounded-full ${
                            event.riskLevel === 'High' ? 'bg-red-500' :
                            event.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${event.riskScore}%` }}
                        />
                      </div>

                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{event.explanation}</p>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><User size={12} className="text-slate-600" /> {event.username}</span>
                        <span className="flex items-center gap-1 font-mono text-xs normal-case">{event.ipAddress}</span>
                        <span className="flex items-center gap-1"><Monitor size={12} className="text-slate-600" /> {event.device}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-600" /> {event.location}</span>}
                        <span className="flex items-center gap-1"><Clock size={12} className="text-slate-600" /> {new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions column */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!event.acknowledged && event.riskLevel === 'High' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcknowledge(event.id); }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {expanded === event.id && (
                  <div className="mt-4 pt-4 border-t border-blue-500/10 animate-fade-in space-y-4">
                    {event.filePath && (
                      <div className="p-2.5 rounded-lg bg-black/30 border border-blue-500/5 font-mono text-xs text-slate-400 break-all">
                        Target File resource: {event.filePath}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Automated Threat Recommendations</h4>
                      <ul className="space-y-2">
                        {event.recommendedActions.map((action, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="text-cyan-400 font-bold">»</span> {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBlockUser(event.username); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
                      >
                        <ShieldX size={14} /> Block User Session
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleForceMFA(event.username); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-300 border border-blue-500/10 hover:bg-white/10 transition-colors"
                      >
                        <Key size={14} /> Force MFA Check
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEvents.length === 0 && !loading && (
          <GlassCard className="text-center py-12 border border-blue-500/10">
            <ShieldAlert size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm font-semibold">No threat events matching your criteria</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
  );
}
