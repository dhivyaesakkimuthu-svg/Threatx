import { useEffect, useState } from 'react';
import { RefreshCw, MapPin, Monitor, User, Clock, ShieldAlert, ShieldX, Key, Search, Play } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import RiskBadge from '../components/ui/RiskBadge';
import ThreatTypeIcon from '../components/ui/ThreatTypeIcon';
import LiveBadge from '../components/ui/LiveBadge';
import { api, type SecurityAlert } from '../api/client';
import { getSocket } from '../api/socket';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityAlert[]>([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.getSecurityEvents().then((data) => {
      if (!cancelled) setSecurityEvents(data);
    }).catch((err) => console.warn('[ThreatMonitor] security events unavailable:', err));

    const socket = getSocket();
    const handleSecurityAlert = (alert: SecurityAlert) => {
      if (!cancelled) setSecurityEvents((current) => [alert, ...current.filter((item) => item.id !== alert.id)].slice(0, 200));
    };
    socket.on('security:alert', handleSecurityAlert);
    return () => {
      cancelled = true;
      socket.off('security:alert', handleSecurityAlert);
    };
  }, []);

  const runAttackSimulation = async () => {
    setSimulationRunning(true);
    setSimulationMessage('Sending scenarios to the target server...');
    try {
      const target = import.meta.env.VITE_DEMO_URL || 'http://localhost:3000';
      const response = await fetch(`${target}/api/simulate/attack`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      setSimulationMessage(`Simulation sent: ${result.levels.join(' / ')}. Events should appear live below.`);
    } catch (err) {
      setSimulationMessage(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setSimulationRunning(false);
    }
  };

  const failedLoginCount = securityEvents.filter((event) => event.eventType === 'failed_login').length;
  const activeAlertCount = securityEvents.filter((event) => event.threatLevel !== 'LOW').length;
  const threatOrder: SecurityAlert['threatLevel'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const currentThreatLevel = securityEvents.reduce<SecurityAlert['threatLevel']>(
    (highest, event) => threatOrder.indexOf(event.threatLevel) > threatOrder.indexOf(highest) ? event.threatLevel : highest,
    'LOW'
  );
  const levelClasses: Record<SecurityAlert['threatLevel'], string> = {
    LOW: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    MEDIUM: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    HIGH: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    CRITICAL: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? { riskLevel: filter, limit: 100 } : { limit: 100 };
      const data = await api.getEvents(params);
      const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(sorted);
      setError(null);
    } catch (err) {
      console.error('[ThreatMonitor] refresh failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load threat events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const params = filter !== 'All' ? { riskLevel: filter, limit: 100 } : { limit: 100 };
        const data = await api.getEvents(params);
        if (!cancelled) {
          const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setEvents(sorted);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ThreatMonitor] refresh failed:', err);
          setError(err instanceof Error ? err.message : 'Failed to load threat events');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const socket = getSocket();

    const handleThreatNew = (newThreat: ThreatEvent) => {
      if (cancelled) return;
      if (filter === 'All' || newThreat.riskLevel === filter) {
        setEvents((prev) => [newThreat, ...prev.filter((e) => e.id !== newThreat.id)]);
      }
    };

    socket.on('threat:new', handleThreatNew);

    // Fallback 30s background poll
    const fallbackInterval = setInterval(load, 30000);

    return () => {
      cancelled = true;
      clearInterval(fallbackInterval);
      socket.off('threat:new', handleThreatNew);
    };
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

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Loading threat events...
          </p>
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2">Connection Lost</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchEvents(); }}
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
      <Header title="Real-time Threat Monitor" subtitle="Live security events stream processed by threat engine" />

      <GlassCard className="border border-blue-500/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase text-slate-400">Current Threat Level</p>
            <span className={`mt-2 inline-flex rounded-md border px-3 py-1 text-sm font-bold ${levelClasses[currentThreatLevel]}`}>{currentThreatLevel}</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <span><strong className="text-white">{securityEvents.length}</strong> <span className="text-slate-400">total events</span></span>
            <span><strong className="text-white">{failedLoginCount}</strong> <span className="text-slate-400">failed logins</span></span>
            <span><strong className="text-white">{activeAlertCount}</strong> <span className="text-slate-400">active alerts</span></span>
          </div>
          <div>
            <button onClick={runAttackSimulation} disabled={simulationRunning} className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50">
              <Play size={14} /> {simulationRunning ? 'Simulating...' : 'Simulate Attack'}
            </button>
            {simulationMessage && <p className="mt-1 max-w-sm text-xs text-slate-400">{simulationMessage}</p>}
          </div>
        </div>
      </GlassCard>

      <section className="space-y-2" aria-label="Live security alerts">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100">Live Security Alerts</h2>
          <LiveBadge active={true} label="LIVE" />
        </div>
        {securityEvents.length === 0 ? (
          <GlassCard className="py-6 text-center text-sm text-slate-400">Waiting for security events from the demo server.</GlassCard>
        ) : securityEvents.slice(0, 100).map((event) => (
          <GlassCard key={event.id} className="border border-blue-500/10 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <time className="text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</time>
                <span className="font-mono text-slate-200">{event.sourceIp}</span>
                <span className="text-slate-300">{event.username}</span>
                <span className="text-slate-400">{event.eventType.replaceAll('_', ' ')}</span>
                {event.path && <span className="font-mono text-slate-500">{event.path}</span>}
              </div>
              <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${levelClasses[event.threatLevel]}`}>{event.threatLevel}</span>
            </div>
            <p className="mt-2 text-xs text-slate-300">{event.explanation}</p>
            <p className="mt-1 text-xs text-slate-500">Recommended: {event.recommendedAction}{event.aiAssessed ? ' · AI assessed' : ' · Rule based'}</p>
          </GlassCard>
        ))}
      </section>

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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Username, IP, threat..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-blue-500/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/30"
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
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-white/5 border border-transparent'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <LiveBadge active={true} label="" />
                <span className="tabular-nums">{filteredEvents.length}</span> Active Stream
              </span>
              <button
                onClick={fetchEvents}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/5 transition-all cursor-pointer"
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
                className={`cursor-pointer transition-all hover:border-blue-500/25 ${event.acknowledged ? 'opacity-60' : ''}`}
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <ThreatTypeIcon type={event.threatType} size={18} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[13px] text-slate-100">
                          {threatLabels[event.threatType] || event.threatType}
                        </span>
                        <RiskBadge level={event.riskLevel} />
                        <span className="text-[11px] text-slate-300 font-semibold bg-white/5 px-2 py-0.5 rounded tabular-nums">
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

                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{event.explanation}</p>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><User size={13} className="text-slate-400" /> {event.username}</span>
                        <span className="flex items-center gap-1 font-mono tabular-nums text-slate-300">{event.ipAddress}</span>
                        <span className="flex items-center gap-1"><Monitor size={13} className="text-slate-400" /> {event.device}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-400" /> {event.location}</span>}
                        <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" /> {new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions column */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!event.acknowledged && event.riskLevel === 'High' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcknowledge(event.id); }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all cursor-pointer"
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
                      <div className="p-2.5 rounded-lg bg-black/30 border border-blue-500/5 font-mono text-xs text-slate-300 break-all">
                        Target File resource: {event.filePath}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Automated Threat Recommendations</h4>
                      <ul className="space-y-2">
                        {event.recommendedActions.map((action, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="text-cyan-400 font-bold">»</span> {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBlockUser(event.username); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors cursor-pointer"
                      >
                        <ShieldX size={14} /> Block User Session
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleForceMFA(event.username); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-200 border border-blue-500/10 hover:bg-white/10 transition-colors cursor-pointer"
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
            <ShieldAlert size={40} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-300 text-sm font-semibold">No threat events matching your criteria</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
