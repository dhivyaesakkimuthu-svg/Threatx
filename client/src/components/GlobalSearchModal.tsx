import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ShieldAlert,
  Bell,
  Server as ServerIcon,
  Users,
  ExternalLink,
  Loader2,
  Terminal,
} from 'lucide-react';
import { api, type GlobalSearchResults } from '../services/api';
import StatusBadge from './StatusBadge';
import type { ThreatEvent, Server } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectThreat?: (threat: ThreatEvent) => void;
  onSelectServer?: (server: Server) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectThreat,
  onSelectServer,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResults>({
    threats: [],
    alerts: [],
    servers: [],
    sessions: [],
    total: 0,
  });

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults({ threats: [], alerts: [], servers: [], sessions: [], total: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ threats: [], alerts: [], servers: [], sessions: [], total: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E4E7EC] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-white">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across threats, alerts, servers, sessions, or IP addresses..."
            className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
          />
          {loading && <Loader2 size={16} className="animate-spin text-blue-600 shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {query.trim() === '' ? (
            <div className="text-center py-10 text-slate-400">
              <Terminal size={24} className="mx-auto mb-2 text-slate-400" />
              <p className="font-semibold text-slate-700">Global ThreatX SOC Search</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Type an IP (e.g. 192.168.1.20), Threat ID (THR-001), Alert, or Server name
              </p>
            </div>
          ) : results.total === 0 && !loading ? (
            <div className="text-center py-10 text-slate-500">
              No matching records found for "{query}"
            </div>
          ) : (
            <>
              {/* Threats */}
              {results.threats.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-red-700 mb-2 flex items-center gap-1.5">
                    <ShieldAlert size={13} /> Threats ({results.threats.length})
                  </h4>
                  <div className="space-y-1.5">
                    {results.threats.map((t) => (
                      <div
                        key={t.id || t.threatId}
                        onClick={() => {
                          onClose();
                          if (onSelectThreat) onSelectThreat(t);
                          else navigate('/threats');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-900 font-bold text-xs">{t.threatId || t.id}</span>
                          <span className="text-slate-800 font-semibold">{t.type || t.threatType}</span>
                          <span className="text-slate-400 font-mono text-[11px]">• {t.source || t.ipAddress}</span>
                        </div>
                        <ExternalLink size={13} className="text-slate-400 group-hover:text-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerts */}
              {results.alerts.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                    <Bell size={13} /> Alerts ({results.alerts.length})
                  </h4>
                  <div className="space-y-1.5">
                    {results.alerts.map((a) => (
                      <div
                        key={a.id || a.alertId}
                        onClick={() => {
                          onClose();
                          navigate('/alerts');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-900 font-bold text-xs">{a.alertId || a.id}</span>
                          <span className="text-slate-800 font-semibold">{a.title}</span>
                          <span className="text-slate-400 font-mono text-[11px]">• {a.source}</span>
                        </div>
                        <StatusBadge status={a.status || 'open'} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Servers */}
              {results.servers.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                    <ServerIcon size={13} /> Monitored Servers ({results.servers.length})
                  </h4>
                  <div className="space-y-1.5">
                    {results.servers.map((s) => (
                      <div
                        key={s.id || s.serverId}
                        onClick={() => {
                          onClose();
                          if (onSelectServer) onSelectServer(s);
                          else navigate('/servers');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-900 font-bold text-xs">{s.serverId || s.id}</span>
                          <span className="text-slate-800 font-semibold">{s.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">• {s.ipAddress}</span>
                        </div>
                        <StatusBadge status={s.status || 'online'} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions */}
              {results.sessions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                    <Users size={13} /> User Sessions ({results.sessions.length})
                  </h4>
                  <div className="space-y-1.5">
                    {results.sessions.map((sess) => (
                      <div
                        key={sess.id || sess.sessionId}
                        onClick={() => {
                          onClose();
                          navigate('/sessions');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-900 font-bold text-xs">{sess.sessionId}</span>
                          <span className="text-slate-800 font-semibold">{sess.username}</span>
                          <span className="text-slate-400 font-mono text-[11px]">• {sess.sourceIp || sess.ipAddress}</span>
                        </div>
                        <StatusBadge status={sess.status || 'active'} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[10px]">Esc</kbd> to close</span>
          <span>ThreatX Search Engine</span>
        </div>
      </div>
    </div>
  );
}
