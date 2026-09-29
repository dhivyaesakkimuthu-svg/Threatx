import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  ShieldAlert,
  Monitor,
  ShieldX,
  Search,
  RefreshCw,
  Smartphone,
  Laptop,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api, type UserSession } from '../services/api';
import { subscribeToSessions } from '../services/socket';

export default function Sessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'flagged' | 'idle' | 'terminated'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(data || []);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();

    const unsub = subscribeToSessions((updatedSession) => {
      setSessions((prev) => {
        const id = updatedSession.sessionId || updatedSession.id;
        const exists = prev.some((s) => (s.sessionId || s.id) === id);
        if (exists) {
          return prev.map((s) => ((s.sessionId || s.id) === id ? updatedSession : s));
        }
        return [updatedSession, ...prev];
      });
    });

    const interval = setInterval(loadSessions, 15000);

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [loadSessions]);

  const handleTerminate = async (id: string) => {
    try {
      await api.terminateSession(id);
      setSessions((prev) =>
        prev.map((s) =>
          (s.sessionId === id || s.id === id ? { ...s, status: 'terminated' as const } : s)
        )
      );
    } catch (err: any) {
      alert(`Could not terminate session: ${err.message}`);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const username = (s.username || '').toLowerCase();
    const ip = (s.ipAddress || s.sourceIp || '').toLowerCase();
    const device = (s.device || '').toLowerCase();
    const location = (s.location || '').toLowerCase();
    const sId = (s.sessionId || s.id || '').toLowerCase();
    return (
      matchesFilter &&
      (!searchQuery ||
        username.includes(query) ||
        ip.includes(query) ||
        device.includes(query) ||
        location.includes(query) ||
        sId.includes(query))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSessions = filteredSessions.slice((validPage - 1) * pageSize, validPage * pageSize);

  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const flaggedCount = sessions.filter((s) => s.status === 'flagged').length;
  const idleCount = sessions.filter((s) => s.status === 'idle').length;
  const terminatedCount = sessions.filter((s) => s.status === 'terminated').length;

  const getDeviceIcon = (deviceStr?: string) => {
    const d = (deviceStr || '').toLowerCase();
    if (d.includes('mac') || d.includes('windows') || d.includes('linux') || d.includes('terminal') || d.includes('ssh')) {
      return <Laptop size={15} className="text-blue-600 shrink-0" />;
    }
    if (d.includes('ios') || d.includes('android') || d.includes('phone') || d.includes('mobile')) {
      return <Smartphone size={15} className="text-indigo-400 shrink-0" />;
    }
    return <Monitor size={15} className="text-gray-500 shrink-0" />;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="User Sessions & Telemetry" subtitle="Fetching active authentication tokens..." />
        <LoadingState />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="User Sessions & Telemetry" connectionStatus="offline" />
        <ErrorState message={error} onRetry={loadSessions} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="User Sessions & Telemetry"
        subtitle="Active client sessions, concurrent device tokens and risk anomalies"
      />

      {/* Stats row - Real session metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Sessions"
          value={activeCount}
          icon={Users}
          accent="cyan"
          trend="Real-time Connections"
          trendDirection="neutral"
        />
        <StatCard
          title="Flagged Anomalies"
          value={flaggedCount}
          icon={ShieldAlert}
          accent="red"
          trend="Immediate Triage"
          trendDirection="up"
        />
        <StatCard
          title="Idle / Standby"
          value={idleCount}
          icon={Monitor}
          accent="amber"
          trend="Timeout Candidate"
          trendDirection="neutral"
        />
        <StatCard
          title="Revoked / Terminated"
          value={terminatedCount}
          icon={ShieldX}
          accent="green"
          trend="Access Removed"
          trendDirection="down"
        />
      </div>

      {/* Table container - Dark Cybersecurity */}
      <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Users size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Connected Sessions Matrix
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search username, IP, location..."
                className="pl-10 pr-4 py-2 rounded-xl bg-gray-50/70 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 w-56 font-sans"
              />
            </div>

            <div className="flex items-center bg-gray-50/70 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
              {(['all', 'active', 'flagged', 'idle', 'terminated'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setFilterStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg capitalize transition-all text-xs font-bold cursor-pointer ${
                    filterStatus === st
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={loadSessions}
              aria-label="Reload sessions list"
              className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {/* Sessions list */}
        {filteredSessions.length === 0 ? (
          <EmptyState
            title="No sessions found"
            description="No active sessions matching the current filter."
            onAction={loadSessions}
            actionLabel="Refresh Sessions"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-[#060911]/90 text-gray-500 font-bold uppercase tracking-wider text-xs">
                  <th className="py-4 px-5">Session &amp; User</th>
                  <th className="py-4 px-5">Device &amp; Client</th>
                  <th className="py-4 px-5">IP Address</th>
                  <th className="py-4 px-5">Geo Location</th>
                  <th className="py-4 px-5">Target Server</th>
                  <th className="py-4 px-5">Risk Score</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-gray-700">
                {paginatedSessions.map((session) => {
                  const id = session.sessionId || session.id || '';
                  const riskScore = session.riskScore ?? 10;
                  const ip = session.ipAddress || session.sourceIp || '127.0.0.1';
                  const location = session.location || 'Internal Network';
                  const device = session.device || 'SSH Client / Terminal';
                  const srv = session.serverId || 'SRV-001';

                  return (
                    <tr key={id} className="hover:bg-gray-100/40 transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-500 text-xs">
                            {(session.username || 'US').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-sm">{session.username}</span>
                            <span className="block text-[11px] text-gray-500 font-mono mt-0.5">{id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device)}
                          <span className="font-medium text-xs">{device}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono font-bold text-blue-500 whitespace-nowrap">
                        {ip}
                      </td>
                      <td className="py-4 px-5 text-gray-600 whitespace-nowrap text-xs">
                        {location}
                      </td>
                      <td className="py-4 px-5 text-gray-500 font-mono text-xs whitespace-nowrap">
                        {srv}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full border ${
                            riskScore > 60
                              ? 'text-rose-500 bg-rose-50 border-rose-500/40'
                              : riskScore > 30
                              ? 'text-amber-500 bg-amber-500/20 border-amber-500/40'
                              : 'text-emerald-500 bg-emerald-50 border-emerald-500/40'
                          }`}
                        >
                          {riskScore}/100
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {session.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                          </span>
                        )}
                        {session.status === 'flagged' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-200">
                            <ShieldAlert size={12} /> Flagged
                          </span>
                        )}
                        {session.status === 'idle' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                            Idle
                          </span>
                        )}
                        {session.status === 'terminated' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-300 line-through">
                            Terminated
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {session.status !== 'terminated' ? (
                          <button
                            onClick={() => handleTerminate(id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500/30 text-rose-500 text-xs font-bold border border-rose-500/40 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                            title="Revoke session token"
                          >
                            <ShieldX size={13} /> Revoke
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">Revoked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {filteredSessions.length > pageSize && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 mt-2">
            <span className="font-mono text-xs">
              Showing {(validPage - 1) * pageSize + 1} to {Math.min(validPage * pageSize, filteredSessions.length)} of {filteredSessions.length} sessions
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 disabled:opacity-40 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono px-2 text-gray-900 font-bold">
                Page {validPage} / {totalPages}
              </span>
              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 disabled:opacity-40 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
