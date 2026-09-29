import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  User,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  FileText,
  ScrollText,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import Button from '../components/ui/Button';
import { api, type AuditLogEntry } from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        page,
        limit: 25,
        search: search || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });

      if (Array.isArray(res)) {
        setLogs(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else if (res && res.data) {
        setLogs(res.data);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || res.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('FAILED') || action.includes('DISABLED') || action.includes('REVOKE')) {
      return 'bg-rose-50 text-rose-500 border-rose-500/40';
    }
    if (action.includes('ROLE') || action.includes('UPDATE') || action.includes('RESOLVE')) {
      return 'bg-amber-500/20 text-amber-500 border-amber-500/40';
    }
    if (action.includes('LOGIN') || action.includes('REGISTER') || action.includes('CREATE')) {
      return 'bg-blue-50 text-blue-500 border-blue-300';
    }
    return 'bg-emerald-50 text-emerald-500 border-emerald-500/40';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Audit Logs & Security Trail"
        subtitle="Immutable MongoDB-backed SOC event audit trail, administrative action history, and access logs"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-gray-200  shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search query */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, IP, resource..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 transition-all font-sans"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
          >
            <option value="all">All Action Types</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_LOGOUT">USER_LOGOUT</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="USER_DISABLED">USER_DISABLED</option>
            <option value="THREAT_UPDATED">THREAT_UPDATED</option>
            <option value="ALERT_UPDATED">ALERT_UPDATED</option>
            <option value="SESSION_TERMINATED">SESSION_TERMINATED</option>
            <option value="REPORT_GENERATED">REPORT_GENERATED</option>
          </select>

          <Button
            type="submit"
            variant="primary"
            size="md"
          >
            Filter Logs
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />}
            onClick={fetchLogs}
            aria-label="Refresh logs"
          >
            Refresh
          </Button>
        </form>

        <div className="text-xs text-gray-500 font-mono">
          Showing <span className="text-gray-900 font-bold">{logs.length}</span> of {totalCount} records
        </div>
      </div>

      {/* Audit Log Table - High Contrast Dark Theme */}
      <div className="bg-white rounded-2xl border border-gray-200  shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#060911]/90 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Operator / User</th>
                <th className="py-4 px-5">Action</th>
                <th className="py-4 px-5">Resource Target</th>
                <th className="py-4 px-5">Source IP &amp; Device</th>
                <th className="py-4 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-600" />
                    <span className="text-sm font-semibold">Querying audit trail from MongoDB...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No audit records found matching query parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.logId || log._id || log.id} className="hover:bg-gray-100/40 transition-colors">
                    <td className="py-4 px-5 font-mono text-xs text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-600 shrink-0" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                          <User size={15} className="text-blue-600" />
                          <span>{log.userName || log.userEmail || log.userId}</span>
                        </div>
                        {log.userRole && (
                          <span className="text-[10px] font-mono uppercase text-blue-500 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 mt-1 inline-block">
                            Role: {log.userRole}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-mono text-xs">
                      <span className="text-gray-900 font-bold">{log.resourceType}</span>
                      {log.resourceId && (
                        <span className="text-gray-500 ml-1.5">({log.resourceId})</span>
                      )}
                    </td>

                    <td className="py-4 px-5 font-mono text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} className="text-gray-400 shrink-0" />
                        <span>{log.ipAddress || '127.0.0.1'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<FileText size={13} />}
                        onClick={() => setSelectedLog(log)}
                      >
                        View JSON
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-[#060911]/60">
            <div>
              Page <span className="text-gray-900 font-bold">{page}</span> of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail JSON Modal - Dark Cyber Glass */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-[#0A0E1A] p-6 shadow-lg relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <Info size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">Audit Record Detail: {selectedLog.logId}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-900"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono text-blue-500 max-h-96 overflow-y-auto">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>

            <div className="flex justify-end mt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
