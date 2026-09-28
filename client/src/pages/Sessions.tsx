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
    const matchesQuery =
      !searchQuery ||
      username.includes(query) ||
      ip.includes(query) ||
      device.includes(query) ||
      location.includes(query) ||
      sId.includes(query);
    return matchesFilter && matchesQuery;
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
      return <Laptop size={14} className="text-blue-600 shrink-0" />;
    }
    if (d.includes('ios') || d.includes('android') || d.includes('phone') || d.includes('mobile')) {
      return <Smartphone size={14} className="text-indigo-600 shrink-0" />;
    }
    return <Monitor size={14} className="text-[#667085] shrink-0" />;
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
    <div className="space-y-6">
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

      {/* Table container */}
      <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-xs">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E4E7EC] mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              Connected Sessions Matrix
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search username, IP, location..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#172033] placeholder:text-[#667085] focus:outline-none focus:border-blue-500 w-52"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-[#E4E7EC] text-xs font-semibold">
              {(['all', 'active', 'flagged', 'idle', 'terminated'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setFilterStatus(st);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded capitalize transition-all text-[11px] font-semibold ${
                    filterStatus === st
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-[#667085] hover:text-[#172033] hover:bg-slate-200/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={loadSessions}
              aria-label="Reload sessions list"
              className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-[#667085] hover:text-[#172033] transition-colors"
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
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#F8FAFC] text-[#667085] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Session & User</th>
                  <th className="py-3 px-4">Device & Client</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Geo Location</th>
                  <th className="py-3 px-4">Target Server</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {paginatedSessions.map((session) => {
                  const id = session.sessionId || session.id || '';
                  const riskScore = session.riskScore ?? 10;
                  const ip = session.ipAddress || session.sourceIp || '127.0.0.1';
                  const location = session.location || 'Internal Network';
                  const device = session.device || 'SSH Client / Terminal';
                  const srv = session.serverId || 'SRV-001';

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs">
                            {(session.username || 'US').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[#172033]">{session.username}</span>
                            <span className="block text-[10px] text-[#667085] font-mono">{id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#172033] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(device)}
                          <span className="font-medium text-xs">{device}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {ip}
                      </td>
                      <td className="py-3.5 px-4 text-[#172033] whitespace-nowrap">
                        {location}
                      </td>
                      <td className="py-3.5 px-4 text-[#667085] font-mono text-[11px] whitespace-nowrap">
                        {srv}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                            riskScore > 60
                              ? 'text-red-700 bg-red-50 border-red-200'
                              : riskScore > 30
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {riskScore}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {session.status === 'active' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Active
                          </span>
                        )}
                        {session.status === 'flagged' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <ShieldAlert size={10} /> Flagged
                          </span>
                        )}
                        {session.status === 'idle' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Idle
                          </span>
                        )}
                        {session.status === 'terminated' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 line-through">
                            Terminated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {session.status !== 'terminated' ? (
                          <button
                            onClick={() => handleTerminate(id)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold border border-red-200 transition-all flex items-center gap-1 ml-auto shadow-2xs"
                            title="Revoke session token"
                          >
                            <ShieldX size={12} /> Revoke
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#667085] font-mono">Revoked</span>
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
          <div className="p-4 border-t border-[#E4E7EC] flex items-center justify-between text-xs text-[#667085] mt-2">
            <span className="font-mono text-[11px]">
              Showing {(validPage - 1) * pageSize + 1} to {Math.min(validPage * pageSize, filteredSessions.length)} of {filteredSessions.length} sessions
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] disabled:opacity-40 hover:text-[#172033] transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono px-2 text-[#172033] font-bold">
                Page {validPage} / {totalPages}
              </span>
              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] disabled:opacity-40 hover:text-[#172033] transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

